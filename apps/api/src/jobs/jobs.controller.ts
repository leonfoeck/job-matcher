import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsQueryDto } from './jobs.dto';

@Controller('jobs')
export class JobsController {
    constructor(private readonly jobs: JobsService) {}

    @Get()
    list(@Query() q: JobsQueryDto) {
        return this.jobs.list(q);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.jobs.findOne(id);
    }
}
