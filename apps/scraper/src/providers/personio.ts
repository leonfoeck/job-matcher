import { XMLParser } from 'fast-xml-parser';

type Job = {
    company: string; source: 'personio'; baseUrl?: string;
    title: string; url: string; location?: string; seniority?: string; postedAt?: string; rawText?: string;
};

export async function fetchPersonio(company: string, xmlUrl: string): Promise<Job[]> {
    const r = await fetch(xmlUrl + (xmlUrl.includes('?') ? '' : '?language=en'));
    if (!r.ok) throw new Error(`Personio ${company}: ${r.status}`);
    const xml = await r.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const doc = parser.parse(xml);

    const positionsNode =
        doc?.positions?.position ??
        doc?.['workzag-jobs']?.position ??
        doc?.jobs?.position ??
        doc?.position ??
        [];

    const arr: any[] = Array.isArray(positionsNode)
        ? positionsNode
        : positionsNode ? [positionsNode] : [];
    const out: Job[] = [];
    console.log(doc);
    console.log(positionsNode);

    for (const p of arr) {
        const title = p?.name ?? '';
        const seniority = (p?.seniority ?? '').toLowerCase();

        const isStudent = /student|working student|werkstudent/.test(seniority) || /working student|werkstudent/i.test(title);
        if (!isStudent) continue;

        const id = p?.id;
        const url = `https://${company.toLowerCase()}.jobs.personio.de/job/${id}`;
        out.push({
            company,
            source: 'personio',
            title,
            url,
            location: p?.office ?? '',
            seniority: p?.seniority ?? '',
            postedAt: p?.createdAt ?? undefined,
            rawText: p?.description ?? '',
        });

    }
    return out;
}
