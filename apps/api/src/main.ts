// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

function parseCsv(str: string | undefined): string[] {
  if (!str) return [];
  return str
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string): s is string => s.length > 0);
}

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  // CORS
  const defaultOrigins: readonly string[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  const envOrigins = parseCsv(process.env.CORS_ORIGINS);
  const origins: string[] =
    envOrigins.length > 0 ? envOrigins : [...defaultOrigins];

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: false,
    }),
  );

  // Listen
  const port = toNumber(process.env.PORT, 4000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  // Avoids “HTTP links are not secure” by not printing a scheme
  logger.log(`API listening on ${displayHost}:${port}`);
}

// Avoids "no-floating-promises"
void bootstrap();
