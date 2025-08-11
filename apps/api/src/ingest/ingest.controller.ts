// apps/api/src/ingest/ingest.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestRunDto } from './ingest.dto';

@Controller('ingest')
export class IngestController {
  constructor(private readonly svc: IngestService) {}

  @Post('run')
  run(@Body() body: IngestRunDto) {
    const companies = body.websites.map((website) => ({ website: website.trim() }));
    return this.svc.run(companies);
  }
}
