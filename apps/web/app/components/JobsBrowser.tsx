'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type LogoInfo = {
  src: string | null;
  reason: 'explicit' | 'derived' | 'none';
  domain?: string | null;
  host?: string | null;
};

function getLogoInfo(company?: { logoUrl?: string | null; domain?: string | null }): LogoInfo {
  if (!company) return { src: null, reason: 'none' };

  const explicit = (company.logoUrl || '').trim();
  if (explicit) {
    return { src: explicit, reason: 'explicit', domain: company.domain ?? null };
  }

  const raw = (company.domain || '').trim();
  if (!raw) return { src: null, reason: 'none', domain: null };

  const host = raw.replace(/^https?:\/\//, '').split('/')[0] || null;
  if (!host) return { src: null, reason: 'none', domain: raw, host: null };

  return {
    src: `https://logo.clearbit.com/${encodeURIComponent(host)}?size=64`,
    reason: 'derived',
    domain: raw,
    host,
  };
}


type Company = {
  id: number;
  name: string;
  source?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
};

type ApiJob = {
  id: number;
  title: string;
  url: string;
  location?: string | null;
  seniority?: string | null;
  postedAt?: string | null;
  scrapedAt?: string | null;
  company?: Company | null;
};

type Job = {
  id: number;
  title: string;
  url: string;
  location?: string;
  seniority?: string;
  postedAt?: string;
  createdAt: string;
  source?: string;
  company?: { id: number; name: string; logoUrl?: string | null; domain?: string | null };
};


type ApiResult = { data: ApiJob[]; meta: ApiMeta };

type Sort =
  | 'postedAt:desc'
  | 'postedAt:asc'
  | 'createdAt:desc'
  | 'createdAt:asc'
  | 'scrapedAt:desc'
  | 'scrapedAt:asc'
  | 'title:asc'
  | 'title:desc'
  | 'company:asc'
  | 'company:desc';

// Define API meta type from server response
type ApiMeta = {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  hasPrev: boolean;
  hasNext: boolean;
};

type SortableCol = 'title' | 'company' | 'postedAt' | 'createdAt';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function JobsBrowser() {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [onlyStudent, setOnlyStudent] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sort, setSort] = useState<Sort>('postedAt:desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showDebug, setShowDebug] = useState(false);
  const [logoStatus, setLogoStatus] = useState<Record<number, 'ok' | 'error' | 'none'>>({});
  const [logoNote, setLogoNote] = useState<Record<number, string>>({});


  const [data, setData] = useState<Job[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
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

      // Server kennt scrapedAt statt createdAt
      const sortParam: Sort = sort.startsWith('createdAt')
        ? (sort.replace('createdAt', 'scrapedAt') as Sort)
        : sort;
      qs.set('sort', sortParam);
      qs.set('page', String(page));
      qs.set('limit', String(limit));

      const res = await fetch(`${apiBase}/jobs?${qs.toString()}`, { cache: 'no-store' });
      const json: ApiResult = await res.json();

      const mapped: Job[] = (json.data ?? []).map((j) => ({
        id: j.id,
        title: j.title,
        url: j.url,
        location: j.location ?? undefined,
        seniority: j.seniority ?? undefined,
        postedAt: j.postedAt ?? undefined,
        createdAt: j.scrapedAt ?? new Date().toISOString(),
        source: j.company?.source ?? undefined,
        company: j.company
          ? {
            id: j.company.id,
            name: j.company.name,
            logoUrl: j.company.logoUrl ?? null,
            domain: j.company.domain ?? null,
          }
          : undefined,
      }));


      setData(mapped);
      setMeta(json.meta);
    } finally {
      setLoading(false);
    }
  }, [title, company, onlyStudent, dateFrom, dateTo, sort, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  // Bei Filterwechsel auf Seite 1
  useEffect(() => {
    setPage(1);
  }, [title, company, onlyStudent, dateFrom, dateTo, sort, limit]);

  function changeSort(col: SortableCol) {
    setPage(1);
    setSort((prev) => {
      const [fld, dir] = prev.split(':') as [string, 'asc' | 'desc'];
      if (fld === col) {
        const nextDir: 'asc' | 'desc' = dir === 'asc' ? 'desc' : 'asc';
        return `${col}:${nextDir}` as Sort;
      }
      // Defaults beim Spaltenwechsel
      return col === 'title' || col === 'company'
        ? (`${col}:asc` as Sort)
        : (`${col}:desc` as Sort);
    });
  }

  function deriveLogoSrc(company?: {
    logoUrl?: string | null;
    domain?: string | null;
  }): string | null {
    if (!company) return null;

    const explicit = (company.logoUrl || '').trim();
    if (explicit) return explicit;

    const raw = (company.domain || '').trim();
    if (!raw) return null;

    const host = raw.replace(/^https?:\/\//, '').split('/')[0]; // hostname only
    console.log('host', host);
    if (!host) return null;

    return `https://logo.clearbit.com/${encodeURIComponent(host)}?size=64`;
  }

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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
          />
          Debug logos
        </label>


        <select
          className="border rounded p-2 bg-transparent"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
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
                  <Link href={`/cv/${j.id}`} className="underline">
                    {j.title}
                  </Link>
                  {/* tiny external link to original posting */}
                  {j.url && (
                    <a
                      href={j.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-xs opacity-70"
                    >
                      ↗
                    </a>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full border grid place-items-center bg-gray-800 text-gray-200 shrink-0">
                      {/* fallback initial */}
                      <span className="text-xs">{(j.company?.name?.[0] || '?').toUpperCase()}</span>

                      {/* logo overlay */}
                      {(() => {
                        const info = getLogoInfo(j.company);
                        // Console diagnostics per row
                        console.debug('logo-debug', {
                          jobId: j.id,
                          company: j.company?.name,
                          info,
                        });

                        if (!info.src) {
                          // record "none" once
                          if (logoStatus[j.id] !== 'none') {
                            setLogoStatus((s) => ({ ...s, [j.id]: 'none' }));
                            setLogoNote((n) => ({
                              ...n,
                              [j.id]:
                                info.reason === 'none'
                                  ? (info.domain ? 'invalid host' : 'no logoUrl & no domain')
                                  : '',
                            }));
                          }
                          return null;
                        }

                        return (
                          <img
                            src={info.src}
                            alt={`${j.company?.name ?? 'Company'} logo`}
                            className="absolute inset-0 w-full h-full rounded-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onLoad={() => {
                              setLogoStatus((s) => ({ ...s, [j.id]: 'ok' }));
                              setLogoNote((n) => {
                                const { [j.id]: _, ...rest } = n;
                                return rest; // clear note on success
                              });
                            }}
                            onError={(e) => {
                              // Hide broken image
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              setLogoStatus((s) => ({ ...s, [j.id]: 'error' }));
                              setLogoNote((n) => ({
                                ...n,
                                [j.id]: `img error from ${info.reason}${
                                  info.host ? ` (${info.host})` : ''
                                }`,
                              }));
                              console.warn('logo-error', {
                                jobId: j.id,
                                company: j.company?.name,
                                attemptedSrc: info.src,
                              });
                            }}
                          />
                        );
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <span>{j.company?.name ?? '—'}</span>

                      {/* tiny debug line */}
                      {showDebug && (
                        <span className="text-[10px] text-gray-400">
          {(() => {
            const info = getLogoInfo(j.company);
            const status = logoStatus[j.id] || 'none';
            const note = logoNote[j.id];
            return [
              `status=${status}`,
              `reason=${info.reason}`,
              info.domain ? `domain=${info.domain}` : null,
              info.host ? `host=${info.host}` : null,
              info.src ? `src=${info.src}` : null,
              note ? `note=${note}` : null,
            ]
              .filter(Boolean)
              .join(' • ');
          })()}
        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-2 pr-3">{j.location ?? '—'}</td>
                <td className="py-2 pr-3">{j.seniority ?? '—'}</td>
                <td className="py-2 pr-3">
                  {j.postedAt ? new Date(j.postedAt).toLocaleDateString() : '—'}
                </td>
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
