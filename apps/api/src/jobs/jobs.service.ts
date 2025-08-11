// apps/api/src/jobs/jobs.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JobsQueryDto } from './jobs.dto';
import { Prisma } from '@prisma/client';
import type { IngestJob } from '../ingest/ingest.types';
type SortableField =
  | 'title'
  | 'postedAt'
  | 'scrapedAt'
  | 'location'
  | 'seniority';
const isSortableField = (s: string): s is SortableField =>
  (
    ['title', 'postedAt', 'scrapedAt', 'location', 'seniority'] as const
  ).includes(s as SortableField);

function normalizeDomain(input?: string | null): string | null {
  if (!input) return null;
  let s = String(input).trim();
  if (!s) return null;

  try {
    // If it looks like a URL, parse and take the hostname
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      s = u.hostname;
    }
  } catch {
    // not a valid URL; fall back to whatever was provided
  }

  // strip leading www. and lower-case
  s = s.replace(/^www\./i, '').toLowerCase();
  // quick sanity: require at least one dot to look like a domain
  return /\./.test(s) ? s : null;
}

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {} // readonly

  async list(q: JobsQueryDto) {
    const { page = 1, limit = 20 } = q;
    const skip = (page - 1) * limit;

    const where: Prisma.JobPostWhereInput = {};

    if (q.title) where.title = { contains: q.title, mode: 'insensitive' };

    if (q.company || q.source) {
      const companyWhere: Prisma.CompanyWhereInput = {};
      if (q.company) {
        companyWhere.name = { contains: q.company, mode: 'insensitive' };
      }
      if (q.source) {
        companyWhere.source = { equals: q.source };
      }
      // XOR<CompanyRelationFilter, CompanyWhereInput> → hier CompanyWhereInput:
      where.company = companyWhere;
    }

    if (q.onlyStudent === 'true') {
      where.OR = [
        { title: { contains: 'werkstudent', mode: 'insensitive' } },
        { title: { contains: 'working student', mode: 'insensitive' } },
        { seniority: { contains: 'student', mode: 'insensitive' } },
      ];
    }

    if (q.dateFrom || q.dateTo) {
      const gte = q.dateFrom ? new Date(q.dateFrom) : undefined;
      const lte = q.dateTo ? new Date(q.dateTo + 'T23:59:59Z') : undefined;
      where.postedAt = { gte, lte };
    }

    let orderBy:
      | Prisma.JobPostOrderByWithRelationInput
      | Prisma.JobPostOrderByWithRelationInput[] = { scrapedAt: 'desc' };

    if (q.sort) {
      const [fieldRaw, dirRaw] = q.sort.split(':');
      const dir: 'asc' | 'desc' =
        (dirRaw || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

      if (fieldRaw === 'company') {
        orderBy = [{ company: { name: dir } }];
      } else if (isSortableField(fieldRaw)) {
        switch (fieldRaw) {
          case 'title':
            orderBy = { title: dir };
            break;
          case 'postedAt':
            orderBy = { postedAt: dir };
            break;
          case 'scrapedAt':
            orderBy = { scrapedAt: dir };
            break;
          case 'location':
            orderBy = { location: dir };
            break;
          case 'seniority':
            orderBy = { seniority: dir };
            break;
        }
      }
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.jobPost.count({ where }),
      this.prisma.jobPost.findMany({
        where,
        include: { company: true },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
        hasPrev: page > 1,
        hasNext: skip + items.length < total,
      },
    };
  }

  async upsertMany(jobs: IngestJob[]) {
    // typisiert
    const inserted: string[] = [];
    const updated: string[] = [];

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const j of jobs) {
        const rawDomain = (j as any).domain ?? (j as any).baseUrl ?? null;
        const domain = normalizeDomain(rawDomain);

        // Falls j.logoUrl schon gesetzt: nutzen; sonst Clearbit-URL aus Domain bauen
        const computedLogoUrl = j.logoUrl?.trim()
          ? j.logoUrl.trim()
          : domain
            ? `https://logo.clearbit.com/${encodeURIComponent(domain)}?size=128`
            : null;
        const company = await tx.company.upsert({
          where: { name: j.company },
          update: {
            ...(j.source ? { source: j.source } : {}),
            ...(domain ? { domain } : {}),
            ...(computedLogoUrl ? { logoUrl: computedLogoUrl, logoUpdatedAt: new Date() } : {}),
          },
          create: {
            name: j.company,
            source: j.source ?? 'unknown',
            domain: domain ?? null,
            logoUrl: computedLogoUrl ?? null,
            ...(computedLogoUrl ? { logoUpdatedAt: new Date() } : {}),
          },
        });

        // Job anlegen/aktualisieren (URL ist unique)
        const before = await tx.jobPost.findUnique({ where: { url: j.url } });

        // postedAt robust parsen
        let postedAt: Date | null = null;
        if (j.postedAt) {
          const d = new Date(j.postedAt as any);
          if (!isNaN(d.getTime())) postedAt = d;
        }

        const data: Prisma.JobPostUncheckedCreateInput = {
          companyId: company.id,
          title: j.title,
          url: j.url,
          location: j.location ?? null,
          seniority: j.seniority ?? null,
          postedAt,
          rawText: j.rawText ?? '',
          processed: false,
          scrapedAt: new Date(),
        };

        if (before) {
          await tx.jobPost.update({
            where: { url: j.url },
            data: {
              title: data.title,
              location: data.location,
              seniority: data.seniority,
              postedAt: data.postedAt,
              rawText: data.rawText,
              companyId: data.companyId,
              scrapedAt: data.scrapedAt,
            },
          });
          updated.push(j.url);
        } else {
          await tx.jobPost.create({ data });
          inserted.push(j.url);
        }
      }
    });

    return {
      inserted: inserted.length,
      updated: updated.length,
      total: jobs.length,
    };
  }

  async findOne(id: number) {
    return this.prisma.jobPost.findUnique({
      where: { id },
      include: { company: true },
    });
  }
}
