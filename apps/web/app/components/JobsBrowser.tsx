'use client';

import { useEffect, useMemo, useState } from 'react';

type Company = { id: number; name: string };
type Job = {
  id: number;
  title: string;
  url: string;
  location?: string;
  seniority?: string;
  source?: string; // <-- bleibt wie früher auf Top-Level
  postedAt?: string;
  createdAt: string; // UI-Name bleibt "createdAt"
  company?: Company;
};

type ApiMeta = {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  hasPrev: boolean;
  hasNext: boolean;
};

type ApiResult = { data: any[]; meta: ApiMeta };

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function JobsBrowser() {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [onlyStudent, setOnlyStudent] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sort, setSort] = useState<
    'postedAt:desc' | 'postedAt:asc' | 'createdAt:desc' | 'title:asc' | 'company:asc'
  >('postedAt:desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [data, setData] = useState<Job[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (title) qs.set('title', title);
      if (company) qs.set('company', company);
      if (onlyStudent) qs.set('onlyStudent', 'true');
      if (dateFrom) qs.set('dateFrom', dateFrom);
      if (dateTo) qs.set('dateTo', dateTo);

      // Server kennt "scrapedAt", nicht "createdAt" → translate:
      const sortParam = sort.startsWith('createdAt')
        ? (sort.replace('createdAt', 'scrapedAt') as 'scrapedAt:desc')
        : sort;
      qs.set('sort', sortParam);

      qs.set('page', String(page));
      qs.set('limit', String(limit));

      const res = await fetch(`${apiBase}/jobs?${qs.toString()}`, { cache: 'no-store' });
      const json: ApiResult = await res.json();

      // Daten zu deinem alten Shape mappen:
      const mapped: Job[] = (json.data || []).map((j: any) => ({
        id: j.id,
        title: j.title,
        url: j.url,
        location: j.location ?? undefined,
        seniority: j.seniority ?? undefined,
        postedAt: j.postedAt ?? undefined,
        // createdAt für UI aus scrapedAt ableiten, falls nötig
        createdAt: j.createdAt ?? j.scrapedAt ?? new Date().toISOString(),
        // Top-Level source wiederherstellen:
        source: j.source ?? j.company?.source ?? undefined,
        company: j.company ? { id: j.company.id, name: j.company.name } : undefined,
      }));

      setData(mapped);
      setMeta(json.meta);
    } finally {
      setLoading(false);
    }
  }

  // re-fetch whenever filters/pagination change
  useEffect(() => {
    void load();
  }, [title, company, onlyStudent, dateFrom, dateTo, sort, page, limit]);

  // reset page when filters change substantively
  useEffect(() => {
    setPage(1);
  }, [title, company, onlyStudent, dateFrom, dateTo, sort, limit]);

  function changeSort(col: 'title' | 'company' | 'postedAt' | 'createdAt') {
    setPage(1);
    setSort((prev) => {
      const [fld, dir] = prev.split(':') as [string, 'asc' | 'desc'];
      if (fld === col) {
        return (dir === 'asc' ? `${col}:desc` : `${col}:asc`) as any;
      }
      // defaults when changing column
      return col === 'title' || col === 'company' ? (`${col}:asc` as any) : (`${col}:desc` as any);
    });
  }

  const sortIcon = useMemo(() => {
    const [fld, dir] = sort.split(':');
    return { fld, dir };
  }, [sort]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid md:grid-cols-6 gap-3">
        <input
          className="md:col-span-2 border rounded p-2 bg-transparent"
          placeholder="Filter by title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="md:col-span-2 border rounded p-2 bg-transparent"
          placeholder="Filter by company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          type="date"
          className="border rounded p-2 bg-transparent"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="border rounded p-2 bg-transparent"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyStudent}
            onChange={(e) => setOnlyStudent(e.target.checked)}
          />
          Only Working Student
        </label>

        <select
          className="border rounded p-2 bg-transparent"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="postedAt:desc">Newest (posted)</option>
          <option value="postedAt:asc">Oldest (posted)</option>
          <option value="createdAt:desc">Newest (ingested)</option>
          <option value="title:asc">Title A–Z</option>
          <option value="company:asc">Company A–Z</option>
        </select>

        <select
          className="border rounded p-2 bg-transparent"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
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
            {loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No results
                </td>
              </tr>
            )}
            {data.map((j) => (
              <tr key={j.id} className="border-b hover:bg-white/5">
                <td className="py-2 pr-3">
                  <a href={j.url} target="_blank" rel="noreferrer" className="underline">
                    {j.title}
                  </a>
                </td>
                <td className="py-2 pr-3">{j.company?.name ?? '—'}</td>
                <td className="py-2 pr-3">{j.location ?? '—'}</td>
                <td className="py-2 pr-3">{j.seniority ?? '—'}</td>
                <td className="py-2 pr-3">
                  {j.postedAt ? new Date(j.postedAt).toLocaleDateString() : '—'}
                </td>
                <td className="py-2 pr-3">{j.source ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {meta ? `Total ${meta.total} • Page ${meta.page}/${meta.pageCount}` : '—'}
        </div>
        <div className="space-x-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={!meta?.hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={!meta?.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
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
  col?: 'title' | 'company' | 'postedAt' | 'createdAt';
  sort?: string;
  onClick?: (c: any) => void;
}) {
  let arrow = '';
  if (col && sort) {
    const [fld, dir] = sort.split(':');
    if (fld === col) arrow = dir === 'asc' ? '▲' : '▼';
  }
  if (!col) return <th className="py-2 pr-3">{label}</th>;
  return (
    <th className="py-2 pr-3 cursor-pointer select-none" onClick={() => onClick?.(col)}>
      {label} {arrow && <span className="opacity-70">{arrow}</span>}
    </th>
  );
}
