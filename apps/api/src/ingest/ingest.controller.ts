import { Body, Controller, Post } from '@nestjs/common';
import { IngestService, CompanyInput } from './ingest.service';

@Controller('ingest')
export class IngestController {
    constructor(private readonly svc: IngestService) {}

    @Post('run')
    run(@Body() body: { companies: CompanyInput[] }) {
        const companies = (body?.companies ?? []).map((c) => ({
            name: String(c?.name ?? '').trim(),
            website: c?.website ? String(c.website).trim() : undefined,
        })).filter(c => c.name.length > 0);
        return this.svc.run(companies);
    }
}
