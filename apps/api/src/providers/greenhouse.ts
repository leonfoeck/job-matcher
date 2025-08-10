import { slugCandidates, fetchWithTimeout } from './slug.util';
import { htmlToText } from '../ingest/html.util';
import type { IngestJob } from '../ingest/ingest.types';

export type GreenhouseMatch = { board: string; apiUrl: string };

export async function detectGreenhouse(
  company: string,
  website?: string,
): Promise<GreenhouseMatch | null> {
  for (const board of slugCandidates(company, website)) {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`;
    try {
      const r = await fetchWithTimeout(apiUrl, 5000);
      if (!r.ok) continue;
      const data = await r.json().catch(() => null);
      if (data && typeof data === 'object' && 'jobs' in data) {
        return { board, apiUrl };
      }
    } catch {}
  }
  return null;
}

// small concurrency limit so we don't hammer GH
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (x: T, i: number) => Promise<R>,
) {
  const out: R[] = new Array(items.length) as any;
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
  const data = await r.json();

  const jobs = (data.jobs ?? []).filter(
    (j: any) => j?.title && j?.absolute_url,
  );

  // fetch detail (content HTML) per job
  const detailed = await mapWithLimit(jobs, 6, async (j: any) => {
    let rawText = '';
    try {
      const detailUrl = `https://boards-api.greenhouse.io/v1/boards/${match.board}/jobs/${j.id}`;
      const dr = await fetchWithTimeout(detailUrl, 8000);
      if (dr.ok) {
        const d = await dr.json();
        rawText = htmlToText(d?.content || '');
      }
    } catch {}
    return {
      company,
      source: 'greenhouse' as const,
      title: j.title ?? '',
      url: j.absolute_url ?? '',
      location: j?.location?.name ?? '',
      seniority: '', // not provided directly
      postedAt: j?.updated_at ?? j?.created_at ?? '',
      rawText,
    };
  });

  return detailed;
}
