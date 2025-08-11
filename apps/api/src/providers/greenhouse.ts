import { slugCandidates, fetchWithTimeout } from './slug.util';
import type { IngestJob } from '../ingest/ingest.types';
import { normalizeDomain } from '../ingest/html.util';

export type GreenhouseMatch = { board: string; apiUrl: string };

/* --------------------------------- Helpers -------------------------------- */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

type GhJob = {
  id: number;
  title?: string;
  absolute_url?: string;
  location?: { name?: string } | null;
  updated_at?: string;
  created_at?: string;
};
type GhList = { jobs: GhJob[] };

const isGhJob = (v: unknown): v is GhJob => isObj(v) && typeof (v as any).id === 'number';
const isGhList = (v: unknown): v is GhList => isObj(v) && Array.isArray((v as any).jobs);

// Detail-Response (vereinfachte Guard)
type GhDetail = { content?: string | null };
const isGhDetail = (v: unknown): v is GhDetail => isObj(v) && 'content' in v;

/** einfache, aber robuste HTML-Entity-Dekodierung (inkl. numerisch) */
function decodeHtmlEntities(input: string): string {
  let s = input
    .replace(/&amp;/g, '&')   // zuerst ampersand
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;|&#160;/g, ' ');

  // numerisch: dezimal &#123;
  s = s.replace(/&#(\d+);/g, (_, dec) => {
    const code = Number(dec);
    return Number.isFinite(code) ? String.fromCharCode(code) : _;
  });

  // numerisch: hex &#x1F4A9;
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const code = parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCharCode(code) : _;
  });

  return s;
}

/** Falls der Inhalt als Entities verpackt ist (&lt;p&gt;...), dekodiere ihn einmal. */
function ensureMarkup(html: string): string {
  const hasRealTags = /<\w+[^>]*>/.test(html);
  const hasEncodedTags = /&lt;\w+[^&]*&gt;/.test(html);
  if (!hasRealTags && hasEncodedTags) {
    return decodeHtmlEntities(html);
  }
  return html;
}

/** Optional: iframes entfernen (YouTube etc.), um Dein FE sauber zu halten. */
function stripIframes(html: string): string {
  return html.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
}

/* --------------------------- Detection (boards) ---------------------------- */

export async function detectGreenhouse(
  company: string,
  website?: string,
): Promise<GreenhouseMatch | null> {
  for (const board of slugCandidates(company, website)) {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`;
    try {
      const r = await fetchWithTimeout(apiUrl, 5000);
      if (!r.ok) continue;
      const data: unknown = await r.json().catch(() => null);
      if (isGhList(data)) return { board, apiUrl };
    } catch {
      /* ignore */
    }
  }
  return null;
}

/* ------------------------- Small concurrency limit ------------------------ */

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (x: T, i: number) => Promise<R>,
) {
  const out = new Array<R>(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  const n = Math.min(limit, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, worker));
  return out;
}

/* ------------------------------- Main fetch -------------------------------- */

export async function fetchGreenhouseJobs(
  company: string,
  website: string,
  match: GreenhouseMatch,
): Promise<IngestJob[]> {
  const r = await fetchWithTimeout(match.apiUrl, 8000);
  if (!r.ok) return [];

  const data: unknown = await r.json().catch(() => null);
  if (!isGhList(data)) return [];

  const baseJobs = data.jobs.filter((j) => isGhJob(j) && j.title && j.absolute_url);

  const detailed = await mapWithLimit(baseJobs, 6, async (j) => {
    let rawText = '';
    try {
      const detailUrl = `https://boards-api.greenhouse.io/v1/boards/${match.board}/jobs/${j.id}`;
      const dr = await fetchWithTimeout(detailUrl, 8000);
      if (dr.ok) {
        const d: unknown = await dr.json().catch(() => null);
        if (isGhDetail(d) && typeof d.content === 'string') {
          // 1) Entities → echte Tags, falls nötig
          // 2) iframes raus (optional; FE rendert eh sanitized, aber so ist’s ruhiger)
          rawText = stripIframes(ensureMarkup(d.content));
        }
      }
    } catch {
      /* ignore */
    }

    return {
      company,
      source: 'greenhouse' as const,
      domain: normalizeDomain(website),
      title: j.title ?? '',
      url: j.absolute_url ?? '',
      location:
        isObj(j.location) && typeof j.location.name === 'string'
          ? j.location.name
          : '',
      seniority: '',
      postedAt: j.updated_at ?? j.created_at ?? '',
      rawText, // HTML unverändert (nach minimaler Aufbereitung) speichern
    } satisfies IngestJob;
  });

  // Nur der Vollständigkeit halber: Filtere defensive Nulls
  return detailed.filter((x) => x.title && x.url);
}
