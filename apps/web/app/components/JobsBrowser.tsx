'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import * as RSelect from '@radix-ui/react-select';

/* ---------------------------------- Types --------------------------------- */

type LogoInfo = {
  src: string | null;
  reason: 'explicit' | 'derived' | 'none';
  domain?: string | null;
  host?: string | null;
};

function getLogoInfo(company?: { domain?: string | null }): LogoInfo {
  if (!company) return { src: null, reason: 'none' };
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

type SortableCol = 'title' | 'company' | 'postedAt' | 'createdAt';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

/* ------------------------------ UI: Select -------------------------------- */

type Option = { value: string; label: string };

function UiSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className = 'w-44',
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <RSelect.Root value={value} onValueChange={onValueChange}>
      <RSelect.Trigger
        className={[
          'w-full inline-flex items-center justify-between rounded-md',
          'border border-white/10 bg-zinc-900 text-zinc-100',
          'px-3 py-2 text-sm shadow-sm hover:bg-zinc-800',
          'outline-none focus:outline-none focus-visible:outline-none',
          'focus:ring-1 focus:ring-blue-500 ring-inset focus:ring-offset-0 focus:shadow-none',
          'focus:border-blue-500',
          'appearance-none',
          'min-w-0',
          className,
        ].join(' ')}
        aria-label={placeholder}
      >
        <RSelect.Value placeholder={placeholder} />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden
          className="ml-2 opacity-80 shrink-0"
        >
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 rounded-md border border-white/10 bg-zinc-900 text-zinc-100 shadow-xl"
        >
          <RSelect.Viewport className="p-1 min-w-[var(--radix-select-trigger-width)]">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                className={[
                  'relative flex cursor-pointer select-none items-center rounded',
                  'px-3 py-2 text-sm outline-none',
                  'data-[highlighted]:bg-zinc-800 data-[highlighted]:text-white',
                ].join(' ')}
              >
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
                <RSelect.ItemIndicator className="absolute right-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}

/* ----------------------------- Main component ----------------------------- */

export default function JobsBrowser() {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [onlyStudent, setOnlyStudent] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sort, setSort] = useState<Sort>('postedAt:desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

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
      return col === 'title' || col === 'company'
        ? (`${col}:asc` as Sort)
        : (`${col}:desc` as Sort);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid md:grid-cols-6 gap-4">
        <input
          className="md:col-span-2 border rounded p-2 bg-transparent min-w-0"
          placeholder="Filter by title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="md:col-span-2 border rounded p-2 bg-transparent min-w-0"
          placeholder="Filter by company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          type="date"
          className="border rounded p-2 bg-transparent min-w-0"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="border rounded p-2 bg-transparent min-w-0"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />

        <label className="md:col-span-1 flex items-center gap-2 text-sm whitespace-nowrap md:mr-4">
          <input
            type="checkbox"
            checked={onlyStudent}
            onChange={(e) => setOnlyStudent(e.target.checked)}
          />
          Only Working Student
        </label>

        <div className="hidden md:block md:col-span-1" />

        {/* Sort */}
        <UiSelect
          value={sort}
          onValueChange={(v) => setSort(v as Sort)}
          options={[
            { value: 'postedAt:desc', label: 'Newest (posted)' },
            { value: 'postedAt:asc', label: 'Oldest (posted)' },
            { value: 'createdAt:desc', label: 'Newest (ingested)' },
            { value: 'title:asc', label: 'Title A–Z' },
            { value: 'company:asc', label: 'Company A–Z' },
          ]}
          placeholder="Sort by"
          className="md:col-span-2 w-full min-w-0"
        />

        {/* Limit */}
        <UiSelect
          value={String(limit)}
          onValueChange={(v) => setLimit(parseInt(v, 10))}
          options={[10, 20, 50, 100].map((n) => ({ value: String(n), label: `${n} / page` }))}
          placeholder="Items / page"
          className="md:col-span-2 w-full min-w-0"
        />
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
                      {/* Fallback initial */}
                      <span className="text-xs">{(j.company?.name?.[0] || '?').toUpperCase()}</span>

                      {/* Logo overlay (no debug) */}
                      {(() => {
                        const info = getLogoInfo(j.company);
                        if (!info.src) return null;
                        return (
                          <img
                            src={info.src}
                            alt={`${j.company?.name ?? 'Company'} logo`}
                            className="absolute inset-0 w-full h-full rounded-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Hide broken image
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        );
                      })()}
                    </div>
                    <div className="flex flex-col">
                      <span>{j.company?.name ?? '—'}</span>
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
