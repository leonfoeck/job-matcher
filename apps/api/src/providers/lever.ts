import { slugCandidates, fetchWithTimeout } from './slug.util';
import type { IngestJob } from '../ingest/ingest.types';

export type LeverMatch = { account: string; apiUrl: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

type LeverPosting = {
  text?: string;
  hostedUrl?: string;
  categories?: { location?: string; commitment?: string } | null;
  createdAt?: number;
  descriptionPlain?: string;
};

const isLeverPosting = (v: unknown): v is LeverPosting =>
  isObj(v) && ('hostedUrl' in v || 'text' in v);

export async function detectLever(
  company: string,
  website?: string,
): Promise<LeverMatch | null> {
  for (const account of slugCandidates(company, website)) {
    const apiUrl = `https://api.lever.co/v0/postings/${account}?mode=json`;
    try {
      const r = await fetchWithTimeout(apiUrl, 5000);
      if (!r.ok) continue;
      const data: unknown = await r.json().catch(() => null);
      if (Array.isArray(data)) return { account, apiUrl };
    } catch {
      /* ignore */
    }
  }
  return null;
}

export async function fetchLeverJobs(
  company: string,
  match: LeverMatch,
): Promise<IngestJob[]> {
  const r = await fetchWithTimeout(match.apiUrl, 8000);
  if (!r.ok) return [];

  const data: unknown = await r.json().catch(() => null);
  if (!Array.isArray(data)) return [];

  const postings = data.filter(isLeverPosting);

  return postings
    .map(
      (j): IngestJob => ({
        company,
        source: 'lever',
        title: typeof j.text === 'string' ? j.text : '',
        url: typeof j.hostedUrl === 'string' ? j.hostedUrl : '',
        location:
          isObj(j.categories) && typeof j.categories.location === 'string'
            ? j.categories.location
            : '',
        seniority:
          isObj(j.categories) && typeof j.categories.commitment === 'string'
            ? j.categories.commitment
            : '',
        postedAt:
          typeof j.createdAt === 'number'
            ? new Date(j.createdAt).toISOString()
            : '',
        rawText:
          typeof j.descriptionPlain === 'string' ? j.descriptionPlain : '',
      }),
    )
    .filter((j) => j.title && j.url);
}
