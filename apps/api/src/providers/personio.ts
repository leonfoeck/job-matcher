import { XMLParser } from 'fast-xml-parser';
import { slugCandidates, fetchWithTimeout } from './slug.util';
import { htmlToText } from '../ingest/html.util';
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
      /* ignore */
    }
  }
  return null;
}

// -------- Helpers: enge Typen + Guards
type AnyRecord = Record<string, unknown>;
const isObj = (v: unknown): v is AnyRecord =>
  typeof v === 'object' && v !== null;
const toStr = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
const toArr = <T>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : v == null ? [] : [v as T];

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
};

export async function fetchPersonioJobs(
  company: string,
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

  const doc: unknown = parser.parse(xml);
  if (!isObj(doc)) return [];

  const positionsRaw =
    (isObj(doc.positions) && (doc.positions as AnyRecord).position) ??
    (isObj(doc['workzag-jobs']) &&
      (doc['workzag-jobs'] as AnyRecord).position) ??
    (doc as AnyRecord).position ??
    [];

  const arr = toArr<PersonioPosition>(positionsRaw);

  const jobs: IngestJob[] = arr
    .map((p) => {
      const id = toStr(p?.id);
      const title = toStr(p?.name ?? p?.title);
      const location = toStr(p?.office ?? p?.location ?? p?.city);
      const seniority = toStr(p?.seniority ?? p?.recruitingCategory);
      const postedAt = toStr(
        p?.createdAt ?? (p as AnyRecord)['created-at'] ?? p?.date,
      );

      const url = id
        ? `https://${match.slug}.jobs.personio.de/job/${id}`
        : toStr(p?.url ?? p?.absolute_url);

      const descHtml = toStr(p?.description ?? p?.jobDescription);
      const rawText = htmlToText(descHtml);

      return {
        company,
        source: 'personio',
        title,
        url,
        location,
        seniority,
        postedAt,
        rawText,
      };
    })
    .filter((j) => j.title && j.url);

  return jobs;
}
