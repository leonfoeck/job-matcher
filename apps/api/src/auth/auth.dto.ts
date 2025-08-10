import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// kleine Helper, optional
const trimOrUndef = (v: unknown) =>
  typeof v === 'string' ? v.trim() : undefined;

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => trimOrUndef(value))
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  password!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => trimOrUndef(value))
  name?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => trimOrUndef(value))
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
