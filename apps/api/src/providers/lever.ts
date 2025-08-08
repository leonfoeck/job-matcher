import { slugCandidates, fetchWithTimeout } from './slug.util';

export type LeverMatch = { account: string, apiUrl: string };

export async function detectLever(company: string, website?: string): Promise<LeverMatch | null> {
    for (const account of slugCandidates(company, website)) {
        const apiUrl = `https://api.lever.co/v0/postings/${account}?mode=json`;
        try {
            const r = await fetchWithTimeout(apiUrl, 5000);
            if (!r.ok) continue;
            const data = await r.json().catch(() => null);
            if (Array.isArray(data)) return { account, apiUrl };
        } catch { /* ignore */ }
    }
    return null;
}

export async function fetchLeverJobs(company: string, match: LeverMatch) {
    const r = await fetchWithTimeout(match.apiUrl, 8000);
    if (!r.ok) return [];
    const arr = await r.json();
    return (arr as any[]).map((j:any) => ({
        company,
        source: 'lever' as const,
        title: j?.text ?? '',
        url: j?.hostedUrl ?? '',
        location: (j?.categories?.location ?? ''),
        seniority: (j?.categories?.commitment ?? ''),
        postedAt: j?.createdAt ? new Date(j.createdAt).toISOString() : '',
        rawText: j?.descriptionPlain ?? '',
    })).filter(j => j.title && j.url);
}
