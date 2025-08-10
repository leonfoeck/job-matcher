import { XMLParser } from 'fast-xml-parser';
import { slugCandidates, fetchWithTimeout } from './slug.util';
import { htmlToText } from '../ingest/html.util';

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
    } catch {}
  }
  return null;
}

export async function fetchPersonioJobs(company: string, match: PersonioMatch) {
  const r = await fetchWithTimeout(match.xmlUrl, 8000);
  if (!r.ok) return [];
  const xml = await r.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    isArray: (tag, jpath) =>
      jpath === 'positions.position' || jpath === 'workzag-jobs.position',
  });
  const doc = parser.parse(xml);
  const positions =
    doc?.positions?.position ??
    doc?.['workzag-jobs']?.position ??
    doc?.position ??
    [];
  const arr: any[] = Array.isArray(positions)
    ? positions
    : positions
      ? [positions]
      : [];
  const toText = (v: any) =>
    typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();

  const jobs = arr.map((p) => {
    const id = toText(p?.id);
    const title = toText(p?.name || p?.title);
    const location = toText(p?.office || p?.location || p?.city);
    const seniority = toText(p?.seniority || p?.recruitingCategory);
    const postedAt = toText(p?.createdAt || p?.['created-at'] || p?.date);
    const url = id
      ? `https://${match.slug}.jobs.personio.de/job/${id}`
      : toText(p?.url || p?.absolute_url);

    // description is HTML in most feeds
    const rawText = htmlToText(p?.description || p?.jobDescription || '');
    console.log(rawText);

    return {
      company,
      source: 'personio' as const,
      title,
      url,
      location,
      seniority,
      postedAt,
      rawText,
    };
  });

  return jobs.filter((j) => j.title && j.url);
}
