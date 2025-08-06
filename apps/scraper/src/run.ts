import { fetchGreenhouse } from './providers/greenhouse.js';
import { fetchPersonio } from './providers/personio.js';

type JobInput = {
    company: string; source: string; baseUrl?: string;
    title: string; url: string; location?: string; seniority?: string; postedAt?: string; rawText?: string;
};

async function main() {
    const API = process.env.API_URL ?? 'http://localhost:4000';
    const jobs: JobInput[] = [];

    // ---- add companies here ----
    jobs.push(...await fetchGreenhouse('Isar Aerospace', 'https://boards-api.greenhouse.io/v1/boards/isaraerospace/jobs'));
    jobs.push(...await fetchPersonio('OroraTech', 'https://ororatech.jobs.personio.de/xml'));
    jobs.push(...await fetchPersonio('GridX', 'https://gridx.jobs.personio.de/xml'));
    jobs.push(...await fetchPersonio('GridX', 'https://deepdrive.jobs.personio.de/xml'));
    // ----------------------------

    console.log(`Found ${jobs.length} jobs. Sending to API...`);
    const resp = await fetch(`${API}/jobs/bulk`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jobs }),
    });

    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Bulk upsert failed: ${resp.status} ${text}`);
    }
    console.log('Done:', await resp.json());
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
