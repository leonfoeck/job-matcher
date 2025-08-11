// apps/api/src/ingest/ingest.dto.ts
import { IsArray, ArrayNotEmpty, IsUrl } from 'class-validator';

export class IngestRunDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({ require_tld: true }, { each: true })
  websites!: string[];
}
