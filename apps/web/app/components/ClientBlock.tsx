'use client';

import { useState } from 'react';
import IngestForm from './IngestForm';
import JobsList from './JobsList';

export default function ClientBlock() {
    const [refreshKey, setRefreshKey] = useState(0);
    return (
        <>
            <IngestForm onDone={() => setRefreshKey(k => k + 1)} />
            <JobsList refreshKey={refreshKey} />
        </>
    );
}
