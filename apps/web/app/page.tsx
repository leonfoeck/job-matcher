'use client';

import { useState } from 'react';
import IngestForm from './components/IngestForm';
import JobsBrowser from './components/JobsBrowser';

export default function Home() {
    const [refreshKey, setRefreshKey] = useState(0);
    return (
        <main className="p-6 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Jobs</h1>
            <IngestForm onDone={() => setRefreshKey(k => k + 1)} />
            {/* JobsBrowser has its own filters; we just nudge it to reload after ingest */}
            <div key={refreshKey}>
                <JobsBrowser />
            </div>
        </main>
    );
}
