'use client';
import { useCallback, useEffect, useState } from 'react';

type Job = Readonly<{
  id: number;
  title: string;
  url: string;
  location?: string;
  seniority?: string;
  postedAt?: string;
  company?: Readonly<{ name: string, logoUrl?: string }>;
}>;
type ApiResult = { data: Job[] };

export default function JobsList({ refreshKey = 0 }: { refreshKey?: number }) {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${api}/jobs`, { cache: 'no-store' });
      if (res.ok) {
        const j: ApiResult = await res.json();
        setJobs(j.data);
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading && jobs.length === 0) return <p>Loading…</p>;
  if (jobs.length === 0) return <p className="text-gray-600">Keine Jobs gefunden.</p>;

  return (
    <ul className="space-y-3">
      {jobs.map((j) => (
        <li key={j.id} className="border rounded p-3">
          <div className="font-semibold">
            <a href={j.url} target="_blank" rel="noreferrer">
              {j.title}
            </a>
          </div>
          {j.company?.logoUrl ? (
            <img
              src={j.company.logoUrl}
              alt={`${j.company?.name ?? 'Company'} logo`}
              className="mt-2 w-10 h-10 object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="text-sm text-gray-500">
            {j.company?.name ?? '—'} · {j.location ?? '—'} · {j.seniority ?? '—'}
          </div>
          <div className={'text-sm text-gray-500'}>
            {j.postedAt ? new Date(j.postedAt).toLocaleDateString() : '—'}
          </div>
        </li>
      ))}
    </ul>
  );
}
