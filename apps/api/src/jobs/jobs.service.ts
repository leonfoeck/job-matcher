import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type JobInput = {
    company: string;
    source: string;            // 'greenhouse' | 'personio' | 'custom'
    baseUrl?: string;
    title: string;
    url: string;
    location?: string;
    seniority?: string;
    postedAt?: string | Date | null;
    rawText?: string;
};

@Injectable()
export class JobsService {
    constructor(private prisma: PrismaService) {}

    list() {
        return this.prisma.jobPost.findMany({
            orderBy: { scrapedAt: 'desc' },
            include: { company: true },
        });
    }

    async upsertMany(inputs: JobInput[]) {
        let inserted = 0, updated = 0;

        for (const j of inputs) {
            const company = await this.prisma.company.upsert({
                where: { name: j.company },
                update: { baseUrl: j.baseUrl ?? undefined, source: j.source },
                create: { name: j.company, baseUrl: j.baseUrl, source: j.source },
            });

            const before = await this.prisma.jobPost.findUnique({ where: { url: j.url } });
            await this.prisma.jobPost.upsert({
                where: { url: j.url },
                update: {
                    companyId: company.id,
                    title: j.title,
                    location: j.location ?? null,
                    seniority: j.seniority ?? null,
                    postedAt: j.postedAt ? new Date(j.postedAt) : before?.postedAt ?? null,
                    rawText: j.rawText ?? before?.rawText ?? '',
                    scrapedAt: new Date(),
                },
                create: {
                    companyId: company.id,
                    title: j.title,
                    url: j.url,
                    location: j.location ?? null,
                    seniority: j.seniority ?? null,
                    postedAt: j.postedAt ? new Date(j.postedAt) : null,
                    rawText: j.rawText ?? '',
                },
            });
            before ? updated++ : inserted++;
        }

        return { inserted, updated, total: inputs.length };
    }
}
