import { slugCandidates, fetchWithTimeout } from './slug.util';
import { htmlToText } from '../ingest/html.util';
import type { IngestJob } from '../ingest/ingest.types';

export type GreenhouseMatch = { board: string; apiUrl: string };

// helpers
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

const isGhJob = (v: unknown): v is GhJob =>
  isObj(v) && typeof v.id === 'number';

const isGhList = (v: unknown): v is GhList => isObj(v) && Array.isArray(v.jobs);

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

// small concurrency limit
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

export async function fetchGreenhouseJobs(
  company: string,
  match: GreenhouseMatch,
): Promise<IngestJob[]> {
  const r = await fetchWithTimeout(match.apiUrl, 8000);
  if (!r.ok) return [];

  const data: unknown = await r.json().catch(() => null);
  if (!isGhList(data)) return [];

  const baseJobs = data.jobs.filter(
    (j) => isGhJob(j) && j.title && j.absolute_url,
  );

  const detailed = await mapWithLimit(baseJobs, 6, async (j) => {
    let rawText = '';
    try {
      const detailUrl = `https://boards-api.greenhouse.io/v1/boards/${match.board}/jobs/${j.id}`;
      const dr = await fetchWithTimeout(detailUrl, 8000);
      if (dr.ok) {
        const d: unknown = await dr.json().catch(() => null);
        if (isObj(d) && typeof d.content === 'string') {
          rawText = d.content;
        }
      }
    } catch {
      /* ignore */
    }

    return {
      company,
      source: 'greenhouse' as const,
      title: j.title ?? '',
      url: j.absolute_url ?? '',
      location:
        isObj(j.location) && typeof j.location.name === 'string'
          ? j.location.name
          : '',
      seniority: '',
      postedAt: j.updated_at ?? j.created_at ?? '',
      rawText,
    } satisfies IngestJob;
  });

  return detailed;
}
