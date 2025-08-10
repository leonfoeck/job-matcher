'use client';
import { useCallback, useEffect, useState } from 'react';

type Company = { id: number; name: string; source?: string };
type Job = {
  id: number;
  title: string;
  url: string;
  location?: string;
  seniority?: string;
  postedAt?: string;
  company?: Company;
};
type ApiResult = {
  data: Job[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
};

type Sort = 'postedAt:desc' | 'postedAt:asc' | 'scrapedAt:desc' | 'title:asc' | 'company:asc';
type SortableCol = 'title' | 'company' | 'postedAt' | 'scrapedAt';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function JobsBrowser() {
  const [title] = useState('');
  const [company] = useState('');
  const [onlyStudent] = useState(true);
  const [dateFrom] = useState<string>('');
  const [dateTo] = useState<string>('');
  const [sort, setSort] = useState<Sort>('postedAt:desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [data, setData] = useState<Job[]>([]);
  const [meta, setMeta] = useState<ApiResult['meta'] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (title) qs.set('title', title);
      if (company) qs.set('company', company);
      if (onlyStudent) qs.set('onlyStudent', 'true');
      if (dateFrom) qs.set('dateFrom', dateFrom);
      if (dateTo) qs.set('dateTo', dateTo);
      if (sort) qs.set('sort', sort);
      qs.set('page', String(page));
      qs.set('limit', String(limit));

      const res = await fetch(`${apiBase}/jobs?${qs.toString()}`, { cache: 'no-store' });
      const json: ApiResult = await res.json();
      setData(json.data);
      setMeta(json.meta);
    } finally {
      setLoading(false);
    }
  }, [title, company, onlyStudent, dateFrom, dateTo, sort, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [title, company, onlyStudent, dateFrom, dateTo, sort, limit]);

  function changeSort(col: SortableCol) {
    setPage(1);
    setSort((prev) => {
      const [fld, dir] = prev.split(':') as [string, 'asc' | 'desc'];
      if (fld === col) return `${col}:${dir === 'asc' ? 'desc' : 'asc'}` as Sort;
      return col === 'title' || col === 'company'
        ? (`${col}:asc` as Sort)
        : (`${col}:desc` as Sort);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter-UI ... */}
      <select
        className="border rounded p-2 bg-transparent"
        value={sort}
        onChange={(e) => setSort(e.target.value as Sort)}
      >
        <option value="postedAt:desc">Newest (posted)</option>
        <option value="postedAt:asc">Oldest (posted)</option>
        <option value="scrapedAt:desc">Newest (ingested)</option>
        <option value="title:asc">Title A–Z</option>
        <option value="company:asc">Company A–Z</option>
      </select>
      {/* Tabelle ... */}
      <thead className="text-left border-b">
        <tr>
          <Th label="Title" col="title" sort={sort} onClick={changeSort} />
          <Th label="Company" col="company" sort={sort} onClick={changeSort} />
          <Th label="Location" />
          <Th label="Seniority" />
          <Th label="Posted" col="postedAt" sort={sort} onClick={changeSort} />
          <Th label="Source" />
        </tr>
      </thead>
      <tbody>
        {data.map((j) => (
          <tr key={j.id} className="border-b hover:bg-white/5">
            {/* ...andere Zellen... */}
            <td className="py-2 pr-3">{j.company?.source ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </div>
  );
}

function Th({
  label,
  col,
  sort,
  onClick,
}: {
  label: string;
  col?: SortableCol;
  sort?: Sort;
  onClick?: (c: SortableCol) => void;
}) {
  let arrow = '';
  if (col && sort) {
    const [fld, dir] = sort.split(':') as [SortableCol, 'asc' | 'desc'];
    if (fld === col) arrow = dir === 'asc' ? '▲' : '▼';
  }
  if (!col) return <th className="py-2 pr-3">{label}</th>;
  return (
    <th className="py-2 pr-3 cursor-pointer select-none" onClick={() => onClick?.(col)}>
      {label} {arrow && <span className="opacity-70">{arrow}</span>}
    </th>
  );
}
