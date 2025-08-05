export default async function Home() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${api}/jobs`, { cache: 'no-store' });
    const jobs = await res.json();

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Jobs</h1>

            {(!Array.isArray(jobs) || jobs.length === 0) ? (
                <p>Keine Jobs gefunden.</p>
            ) : (
                <ul className="space-y-3">
                    {jobs.map((j: any) => (
                        <li key={j.id} className="border rounded p-3">
                            <div className="font-semibold">{j.title}</div>
                            <div className="text-sm text-gray-500">
                                {j.company?.name} · {j.location ?? '—'} · {j.seniority ?? '—'}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
