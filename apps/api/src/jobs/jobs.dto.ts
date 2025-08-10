// apps/api/src/jobs/jobs.dto.ts
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsBooleanString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class JobsQueryDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() dateFrom?: string; // YYYY-MM-DD
  @IsOptional() @IsString() dateTo?: string; // YYYY-MM-DD
  @IsOptional() @IsBooleanString() onlyStudent?: string; // "true"/"false"

  // sort: "postedAt:desc", "scrapedAt:desc", "title:asc", "company:asc"
  @IsOptional() @IsString() sort?: string;

  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @Transform(({ value }: { value: string }) =>
    Math.min(parseInt(value, 10) || 20, 100),
  )
  @IsOptional()
  @IsInt()
  limit: number = 20;
}
