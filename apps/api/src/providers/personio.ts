import { XMLParser } from 'fast-xml-parser';
import { slugCandidates, fetchWithTimeout } from './slug.util';
import { normalizeDomain } from '../ingest/html.util';
import type { IngestJob } from '../ingest/ingest.types';

export type PersonioMatch = { slug: string; xmlUrl: string };

export async function detectPersonio(
  company: string,
  website?: string,
): Promise<PersonioMatch | null> {
  for (const slug of slugCandidates(company, website)) {
    const xmlUrl = `https://${slug}.jobs.personio.de/xml?language=en`;
    try {
      const r = await fetchWithTimeout(xmlUrl, 5000);
      if (!r.ok) continue;
      const text = await r.text();
      if (!text || !/</.test(text)) continue;
      return { slug, xmlUrl };
    } catch {
      /* ignore network errors */
    }
  }
  return null;
}

/* ----------------------- Helpers & Type Guards ----------------------- */

type AnyRecord = Record<string, unknown>;
const isObj = (v: unknown): v is AnyRecord => typeof v === 'object' && v !== null;

const toArr = <T>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : v == null ? [] : [v as T];

const toStr = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  return '';
};

// hasPosition(x) – TS-safe Prüfung auf { position: unknown }
function hasPosition(x: unknown): x is AnyRecord & { position: unknown } {
  return isObj(x) && 'position' in x;
}

/**
 * Extrahiert HTML aus Personio-Positionen.
 * - Neues Schema: position.jobDescriptions.jobDescription[] ({ name, value })
 * - Legacy: description / jobDescription / jobDescriptions
 * Gibt zusammengefügtes HTML zurück (mit <h3>-Sections, falls vorhanden).
 */
function extractPersonioRawHtml(position: AnyRecord): string {
  const parts: string[] = [];

  // Neues Schema
  const jd = isObj(position.jobDescriptions) ? position.jobDescriptions : null;
  const nodes =
    jd && 'jobDescription' in jd
      ? toArr<unknown>((jd as AnyRecord).jobDescription)
      : [];

  for (const node of nodes) {
    if (typeof node === 'string') {
      const s = node.trim();
      if (s) parts.push(s);
      continue;
    }
    if (isObj(node)) {
      const title =
        toStr(node.name) ||
        toStr((node as AnyRecord)['@_name']) ||
        toStr((node as AnyRecord).title);

      let html =
        toStr((node as AnyRecord).value) ||
        toStr((node as AnyRecord)['#text']) ||
        toStr((node as AnyRecord).content) ||
        toStr((node as AnyRecord).text);

      // Fallback: alle string-Props sammeln
      if (!html) {
        html = Object.values(node)
          .filter((v) => typeof v === 'string')
          .map((v) => (v as string).trim())
          .filter(Boolean)
          .join('\n\n');
      }

      if (html) {
        parts.push(title ? `<h3>${title}</h3>\n${html}` : html);
      }
    }
  }

  // Legacy-Felder
  if (parts.length === 0) {
    const legacy =
      toStr((position as AnyRecord).description) ||
      toStr((position as AnyRecord).jobDescription) ||
      toStr((position as AnyRecord).jobDescriptions);
    if (legacy) parts.push(legacy);
  }

  return parts.join('\n\n');
}

/* ------------------------------ Types ------------------------------ */

type PersonioPosition = {
  id?: unknown;
  name?: unknown;
  title?: unknown;
  office?: unknown;
  location?: unknown;
  city?: unknown;
  seniority?: unknown;
  recruitingCategory?: unknown;
  createdAt?: unknown;
  ['created-at']?: unknown;
  date?: unknown;
  url?: unknown;
  absolute_url?: unknown;
  description?: unknown;
  jobDescription?: unknown;
  jobDescriptions?: unknown;
};

/* --------------------------- Main Fetcher --------------------------- */

export async function fetchPersonioJobs(
  company: string,
  website: string,
  match: PersonioMatch,
): Promise<IngestJob[]> {
  const r = await fetchWithTimeout(match.xmlUrl, 8000);
  if (!r.ok) return [];

  const xml = await r.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    isArray: (_tag, jpath) =>
      jpath === 'positions.position' || jpath === 'workzag-jobs.position',
  });

  const parsed: unknown = parser.parse(xml);
  if (!isObj(parsed)) return [];

  // Positionen robust extrahieren
  let positionsRaw: unknown = [];
  const positions = (parsed as AnyRecord).positions;
  if (hasPosition(positions)) {
    positionsRaw = positions.position;
  } else {
    const workzag = (parsed as AnyRecord)['workzag-jobs'];
    if (hasPosition(workzag)) {
      positionsRaw = workzag.position;
    } else if (hasPosition(parsed)) {
      positionsRaw = (parsed as AnyRecord).position;
    }
  }

  const arr = toArr<PersonioPosition>(positionsRaw);

  const out = arr
    .map((p): IngestJob | null => {
      const id = toStr((p as AnyRecord).id);
      const title = toStr((p as AnyRecord).name ?? (p as AnyRecord).title);
      const location = toStr(
        (p as AnyRecord).office ??
        (p as AnyRecord).location ??
        (p as AnyRecord).city,
      );
      const seniority = toStr(
        (p as AnyRecord).seniority ?? (p as AnyRecord).recruitingCategory,
      );
      const postedAt = toStr(
        (p as AnyRecord).createdAt ??
        (p as AnyRecord)['created-at'] ??
        (p as AnyRecord).date,
      );

      // URL bauen (bevorzugt über ID)
      let url = id
        ? `https://${match.slug}.jobs.personio.de/job/${id}`
        : toStr((p as AnyRecord).url ?? (p as AnyRecord).absolute_url);

      url = url.trim();

      // Ohne Titel/URL nicht speicherbar → skip
      if (!title || !url) return null;

      const rawText = extractPersonioRawHtml(p as AnyRecord);

      return {
        company,
        domain: normalizeDomain(website),
        source: 'personio',
        title,
        url,
        location,
        seniority,
        postedAt,
        rawText, // HTML unverändert speichern; Rendering im Frontend aufbereiten
      };
    })
    .filter((j): j is IngestJob => !!j);

  return out;
}
