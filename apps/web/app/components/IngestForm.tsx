'use client';
import { useState } from 'react';

interface IngestFormProps {
    onDone?: () => void;
}

export default function IngestForm({ onDone }: Readonly<IngestFormProps>) {
    const [companiesText, setCompaniesText] = useState('Isar Aerospace\nOroraTech\nGridX');
    const [websiteText, setWebsiteText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

    async function onRun(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        const names = companiesText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const sites = websiteText.split(/\r?\n/);
        const companies = names.map((name, i) => ({ name, website: (sites[i] || '').trim() || undefined }));
        try {
            const res = await fetch(`${api}/ingest/run`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ companies }),
            });
            const json = await res.json();
            setResult(json);
            onDone?.();                    // <-- trigger reload of the list
        } catch (e:any) {
            setResult({ error: String(e) });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onRun} className="space-y-3 border rounded p-4">
            <div>
                <label htmlFor="companies" className="block font-semibold mb-1">Companies (one per line)</label>
                <textarea id="companies" className="w-full border rounded p-2 h-28" value={companiesText} onChange={e=>setCompaniesText(e.target.value)} />
            </div>
            <div>
                <label htmlFor="websites" className="block font-semibold mb-1">Websites (optional, one per line aligned)</label>
                <textarea id="websites" className="w-full border rounded p-2 h-20" value={websiteText} onChange={e=>setWebsiteText(e.target.value)} />
            </div>
            <button className="px-3 py-2 rounded bg-black text-white disabled:opacity-50" disabled={loading}>
                {loading ? 'Fetching…' : 'Fetch jobs'}
            </button>
            {result && (
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-2 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            )}
        </form>
    );
}
