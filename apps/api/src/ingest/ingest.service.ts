// apps/api/src/ingest/ingest.service.ts
import { Injectable } from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service';
import { detectPersonio, fetchPersonioJobs } from '../providers/personio';
import { detectGreenhouse, fetchGreenhouseJobs } from '../providers/greenhouse';
import { detectLever, fetchLeverJobs } from '../providers/lever';
import { normalizeDomain } from './html.util';
import type { IngestJob } from './ingest.types';

export type CompanyInput = { name: string; website?: string };

@Injectable()
export class IngestService {
  constructor(private readonly jobs: JobsService) {}

  async run(companies: CompanyInput[]) {
    const results: Array<Record<string, unknown>> = [];

    for (const c of companies) {
      const name = c.name.trim();
      const website = c.website?.trim();
      if (!name) continue;

      // compute once
      const domainForCompany = normalizeDomain(website ?? null) ?? undefined;

      let matched = false;
      let total = 0;

      try {
        const m = await detectPersonio(name, c.website);
        if (m) {
          let list: IngestJob[] = await fetchPersonioJobs(name, m);
          if (domainForCompany) {
            list = list.map(j => ({ ...j, domain: domainForCompany }));
          }
          total += list.length;
          await this.jobs.upsertMany(list);
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
        const m = await detectGreenhouse(name, c.website);
        if (m) {
          let list = await fetchGreenhouseJobs(name, m);
          if (domainForCompany) {
            list = list.map(j => ({ ...j, domain: domainForCompany }));
          }
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
        const m = await detectLever(name, c.website);
        if (m) {
          let list = await fetchLeverJobs(name, m);
          if (domainForCompany) {
            list = list.map(j => ({ ...j, domain: domainForCompany }));
          }
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
