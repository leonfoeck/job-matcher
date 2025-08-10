// apps/api/src/users/users.dto.ts
import {
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectDto {
  @IsString() name!: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsString() tech?: string;
  @IsOptional() @IsString() description?: string;
}

export class ExperienceDto {
  @IsString() company!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() start?: string; // YYYY-MM
  @IsOptional() @IsString() end?: string; // YYYY-MM
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() tech?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(120) headline?: string;
  @IsOptional() @IsString() @MaxLength(2000) summary?: string;
  @IsOptional() @IsString() skills?: string; // csv
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];
}
