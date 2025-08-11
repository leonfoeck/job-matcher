'use client';
import { useState } from 'react';

interface IngestFormProps {
  onDone?: () => void;
}

export default function IngestForm({ onDone }: Readonly<IngestFormProps>) {
  const [websiteText, setWebsiteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

  async function onRun(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const websites = websiteText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch(`${api}/ingest/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ websites }),
      });
      const json = await res.json();
      setResult(json);
      onDone?.();
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onRun} className="space-y-3 border rounded p-4">
      <div>
        <label htmlFor="websites" className="block font-semibold mb-1">
          Websites (one per line aligned)
        </label>
        <textarea
          id="websites"
          className="w-full border rounded p-2 h-20"
          value={websiteText}
          onChange={(e) => setWebsiteText(e.target.value)}
        />
      </div>
      <button
        className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Fetching…' : 'Fetch jobs'}
      </button>
      {result !== null && (
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-2 overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </form>
  );
}
