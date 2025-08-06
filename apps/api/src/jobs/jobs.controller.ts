import { Controller, Get, Post, Body } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
    constructor(private readonly svc: JobsService) {}

    @Get()
    getAll() {
        return this.svc.list();
    }

    @Post('bulk')
    bulk(@Body() body: { jobs: any[] }) {
        return this.svc.upsertMany(body?.jobs ?? []);
    }
}
