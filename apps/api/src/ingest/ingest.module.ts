import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule], // <-- needed so JobsService is in scope
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule {}
