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
    const inserted: string[] = [];
    const updated: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const j of jobs) {
        const domain = (j.domain ?? '').trim() || null;

        // --- Company: prefer unique upsert by domain ---
        let companyId: number;

        if (domain) {
          const company = await tx.company.upsert({
            where: { domain }, // ✅ unique field
            update: {
              ...(j.source ? { source: j.source } : {}),
              ...(j.company ? { name: j.company } : {}),
            },
            create: {
              name: j.company,
              source: j.source ?? 'unknown',
              domain,
            },
            select: { id: true },
          });
          companyId = company.id;
        } else {
          // No domain → cannot upsert. Try find by name and update or create.
          const existing = await tx.company.findFirst({
            where: { name: j.company },
            select: { id: true },
          });

          if (existing) {
            await tx.company.update({
              where: { id: existing.id },
              data: { ...(j.source ? { source: j.source } : {}) },
            });
            companyId = existing.id;
          } else {
            const created = await tx.company.create({
              data: {
                name: j.company,
                source: j.source ?? 'unknown',
                domain: null,
              },
              select: { id: true },
            });
            companyId = created.id;
          }
        }

        // --- Job: URL is unique ---
        const before = await tx.jobPost.findUnique({ where: { url: j.url } });

        // robust postedAt parsing
        let postedAt: Date | null = null;
        if (j.postedAt) {
          const d = new Date(j.postedAt as any);
          if (!isNaN(d.getTime())) postedAt = d;
        }

        const data: Prisma.JobPostUncheckedCreateInput = {
          companyId,
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
