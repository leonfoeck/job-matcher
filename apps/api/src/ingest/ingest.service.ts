// apps/api/src/ingest/ingest.service.ts
import { Injectable } from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service';
import { detectPersonio, fetchPersonioJobs } from '../providers/personio';
import { detectGreenhouse, fetchGreenhouseJobs } from '../providers/greenhouse';
import { detectLever, fetchLeverJobs } from '../providers/lever';
import type { IngestJob } from './ingest.types';
import { parse } from 'tldts';

export type CompanyInput = { website: string };

export function companyNameFromUrl(input?: string | null): string {
  if (!input) return '';
  let host = '';

  try {
    const u = new URL(input);
    host = u.hostname;
  } catch {
    host = String(input || '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .split(/[/?#]/, 1)[0];
  }

  if (!host) return '';

  const info = parse(host, { allowPrivateDomains: true });
  if (info.isIp) return '';

  // eTLD+1 like "robco.de"
  const domain = info.domain || host;
  const suffixParts = (info.publicSuffix || '').split('.').filter(Boolean);
  const parts = domain.split('.');

  // Strip the public suffix to get the SLD (e.g., "robco")
  const sld =
    parts.slice(0, parts.length - suffixParts.length).join('.') ||
    parts[0] ||
    '';
  return sld.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class IngestService {
  constructor(private readonly jobs: JobsService) {}

  async run(companies: CompanyInput[]) {
    const results: Array<Record<string, unknown>> = [];

    for (const c of companies) {
      const website = c.website.trim();
      if (!website) {
        continue;
      }

      const name = companyNameFromUrl(website);

      let matched = false;
      let total = 0;

      try {
        const m = await detectPersonio(name, website);
        if (m) {
          const list: IngestJob[] = await fetchPersonioJobs(name, website, m);
          total += list.length;
          results.push({
            company: name,
            provider: 'personio',
            slug: m.slug,
            count: list.length,
          });
          matched = true;
        }
      } catch (e) {
        results.push({ company: name, provider: 'personio', error: String(e) });
      }

      try {
        const m = await detectGreenhouse(name, website);
        if (m) {
          const list = await fetchGreenhouseJobs(name, website, m);
          total += list.length;
          await this.jobs.upsertMany(list);
          results.push({
            company: name,
            provider: 'greenhouse',
            board: m.board,
            count: list.length,
          });
          matched = true;
        }
      } catch (e) {
        results.push({
          company: name,
          provider: 'greenhouse',
          error: String(e),
        });
      }

      try {
        const m = await detectLever(name, website);
        if (m) {
          const list = await fetchLeverJobs(name, website, m);
          total += list.length;
          await this.jobs.upsertMany(list);
          results.push({
            company: name,
            provider: 'lever',
            account: m.account,
            count: list.length,
          });
          matched = true;
        }
      } catch (e) {
        results.push({ company: name, provider: 'lever', error: String(e) });
      }

      if (!matched) {
        results.push({
          company: name,
          provider: null,
          count: 0,
          note: 'no provider detected',
        });
      }
      results.push({ company: name, total });
    }

    return { results };
  }
}
