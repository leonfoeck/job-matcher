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

// -------- Helpers
type AnyRecord = Record<string, unknown>;
const isObj = (v: unknown): v is AnyRecord =>
  typeof v === 'object' && v !== null;

// Nur erlaubte Primitive/Date in String umwandeln – keine Objekte:
const toStr = (v: unknown): string => {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  return '';
};

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

  const parsed: unknown = parser.parse(xml);
  if (!isObj(parsed)) return [];

  const root = parsed;

  // positionsRaw ohne verschachtelte Ternaries holen
  let positionsRaw: unknown = [];
  if (isObj(root.positions) && 'position' in root.positions) {
    positionsRaw = root.positions.position;
  } else if (
    isObj(root['workzag-jobs']) &&
    'position' in root['workzag-jobs']
  ) {
    positionsRaw = root['workzag-jobs'].position;
  } else if ('position' in root) {
    positionsRaw = root.position;
  }

  const arr = toArr<PersonioPosition>(positionsRaw);

  return arr
    .map<IngestJob>((p) => {
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
}
