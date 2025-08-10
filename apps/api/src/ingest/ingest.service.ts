import { Injectable } from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service';
import { detectPersonio, fetchPersonioJobs } from '../providers/personio';
import { detectGreenhouse, fetchGreenhouseJobs } from '../providers/greenhouse';
import { detectLever, fetchLeverJobs } from '../providers/lever';

export type CompanyInput = { name: string; website?: string };

@Injectable()
export class IngestService {
  constructor(private jobs: JobsService) {}

  async run(companies: CompanyInput[]) {
    const results: any[] = [];
    for (const c of companies) {
      const name = c.name.trim();
      if (!name) continue;

      let matched = false;
      let total = 0;

      // Personio
      try {
        const m = await detectPersonio(name, c.website);
        if (m) {
          const jobs = await fetchPersonioJobs(name, m);
          total += jobs.length;
          console.log(jobs);
          await this.jobs.upsertMany(jobs as any);
          results.push({
            company: name,
            provider: 'personio',
            slug: m.slug,
            count: jobs.length,
          });
          matched = true;
        }
      } catch (e) {
        results.push({ company: name, provider: 'personio', error: String(e) });
      }

      // Greenhouse
      try {
        const m = await detectGreenhouse(name, c.website);
        if (m) {
          const jobs = await fetchGreenhouseJobs(name, m);
          total += jobs.length;
          console.log(jobs);
          await this.jobs.upsertMany(jobs as any);
          results.push({
            company: name,
            provider: 'greenhouse',
            board: m.board,
            count: jobs.length,
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

      // Lever
      try {
        const m = await detectLever(name, c.website);
        if (m) {
          const jobs = await fetchLeverJobs(name, m);
          total += jobs.length;
          await this.jobs.upsertMany(jobs as any);
          results.push({
            company: name,
            provider: 'lever',
            account: m.account,
            count: jobs.length,
          });
          matched = true;
        }
      } catch (e) {
        results.push({ company: name, provider: 'lever', error: String(e) });
      }

      if (!matched)
        results.push({
          company: name,
          provider: null,
          count: 0,
          note: 'no provider detected',
        });
      results.push({ company: name, total });
    }
    return { results };
  }
}
