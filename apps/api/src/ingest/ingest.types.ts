// src/jobs/ingest.types.ts
export type IngestJob = {
  company: string;
  title: string;
  url: string;
  location?: string;
  seniority?: string;
  postedAt?: string | Date;
  rawText?: string;
  source?: string;
  baseUrl?: string;
  domain?: string;
};
