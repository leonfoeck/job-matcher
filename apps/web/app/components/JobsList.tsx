'use client';
import { useEffect, useState } from 'react';

type Job = { id: number; title: string; url: string; location?: string; seniority?: string; company?: { name: string } };

export default function JobsList({ refreshKey = 0 }: { refreshKey?: number }) {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch(`${api}/jobs`, { cache: 'no-store' });
            if (res.ok) setJobs(await res.json());
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, [refreshKey]);

    if (loading && jobs.length === 0) return <p>Loading…</p>;
    if (jobs.length === 0) return <p className="text-gray-600">Keine Jobs gefunden.</p>;

    return (
        <ul className="space-y-3">
            {jobs.map((j) => (
                <li key={j.id} className="border rounded p-3">
                    <div className="font-semibold">
                        <a href={j.url} target="_blank" rel="noreferrer">{j.title}</a>
                    </div>
                    <div className="text-sm text-gray-500">
                        {j.company?.name ?? '—'} · {j.location ?? '—'} · {j.seniority ?? '—'}
                    </div>
                </li>
            ))}
        </ul>
    );
}
