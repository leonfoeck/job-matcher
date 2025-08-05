type Job = {
    company: string; source: 'greenhouse'; baseUrl?: string;
    title: string; url: string; location?: string; seniority?: string; postedAt?: string; rawText?: string;
};

export async function fetchGreenhouse(company: string, apiUrl: string): Promise<Job[]> {
    const r = await fetch(apiUrl);
    if (!r.ok) throw new Error(`Greenhouse ${company}: ${r.status}`);
    const data = await r.json();
    const out: Job[] = [];
    for (const job of data?.jobs ?? []) {
        const title = job?.title ?? '';
        if (/(working student|werkstudent)/i.test(title)) {
            out.push({
                company,
                source: 'greenhouse',
                title,
                url: job.absolute_url,
                location: job?.location?.name ?? '',
                seniority: 'Working Student',
                postedAt: job?.updated_at ?? job?.created_at,
                rawText: job?.content ?? '',
            });
        }
    }
    return out;
}
