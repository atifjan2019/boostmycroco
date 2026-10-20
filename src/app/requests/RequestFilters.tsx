'use client';

import { useEffect, useRef, useState } from 'react';
import RequestCard from '@/components/RequestCard';
import { PAGER_BUTTON, PAGER_BUTTON_DISABLED } from '@/components/Pagination';
import type { RequestCardData } from '@/lib/public-api';
import { REQUEST_TYPES } from '@/lib/request-form';
import { STATUS_FILTERS } from '@/lib/request-status';

const PER_PAGE = 12;

interface Result {
  key: string;
  requests: RequestCardData[];
  total: number;
  lastPage: number;
  failed: boolean;
}

function toResult(key: string, data: unknown): Result {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const requests = Array.isArray(d.requests) ? (d.requests as RequestCardData[]) : [];
  const total = typeof d.total === 'number' ? d.total : requests.length;
  const lastPage = typeof d.lastPage === 'number' && d.lastPage >= 1 ? d.lastPage : Math.max(1, Math.ceil(total / PER_PAGE));
  return { key, requests, total, lastPage, failed: false };
}

/**
 * Search and filters for /requests. With nothing chosen it shows the server-rendered page it wraps (`children`),
 * so the crawlable list and its page links stay as they are. With a filter it loads the matching requests in the
 * browser and shows them in place of that list, without changing the address (the page's canonical stays the
 * unfiltered list).
 */
export default function RequestFilters({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search after the visitor stops typing for a moment.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const active = query !== '' || status !== '' || type !== '';
  let key = '';
  if (active) {
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (query) params.set('search', query);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    key = params.toString();
  }

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/requests?${key}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setResult(toResult(key, data)))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, requests: [], total: 0, lastPage: 1, failed: true });
      });
    return () => controller.abort();
  }, [key]);

  const current = result && result.key === key ? result : null;
  const loading = active && !current;

  const clear = () => {
    setSearch('');
    setQuery('');
    setStatus('');
    setType('');
    setPage(1);
  };

  const goTo = (n: number) => {
    setPage(n);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 mb-10 p-4 bg-white rounded-xl border border-border shadow-sm">
        <label htmlFor="request-search" className="sr-only">Search requests</label>
        <input
          id="request-search"
          type="search"
          className="input max-w-sm bg-white"
          placeholder="Search requests..."
          value={search}
          maxLength={100}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <label htmlFor="request-status" className="sr-only">Status</label>
        <select id="request-status" className="select bg-white" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <label htmlFor="request-type" className="sr-only">Type</label>
        <select id="request-type" className="select bg-white" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {(active || search !== '') && (
          <button type="button" onClick={clear} className="btn btn-outline bg-white hover:bg-slate-50">
            Clear filters
          </button>
        )}
      </div>

      <p role="status" className="sr-only">
        {current && !current.failed ? `${current.total} ${current.total === 1 ? 'request matches' : 'requests match'} your filters.` : ''}
      </p>

      {!active ? (
        children
      ) : (
        <div ref={resultsRef} className="scroll-mt-24">
          {loading ? (
            <div className="flex justify-center py-20" aria-hidden="true">
              <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : current?.failed ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">
              The requests could not be loaded. Please try again in a minute.
            </div>
          ) : !current || current.requests.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">No requests found.</div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-500 mb-6">
                {current.total.toLocaleString('en-GB')} {current.total === 1 ? 'request matches' : 'requests match'} your filters
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {current.requests.map((r, i) => <RequestCard key={r.slug ?? r.id ?? i} request={r} />)}
              </div>
              {current.lastPage > 1 && (
                <div className="flex justify-center items-center gap-3 mt-14">
                  <button type="button" className={page > 1 ? PAGER_BUTTON : PAGER_BUTTON_DISABLED} disabled={page <= 1} onClick={() => goTo(page - 1)}>← Prev</button>
                  <span className="px-2 font-semibold text-slate-600 text-sm">Page {page} of {current.lastPage}</span>
                  <button type="button" className={page < current.lastPage ? PAGER_BUTTON : PAGER_BUTTON_DISABLED} disabled={page >= current.lastPage} onClick={() => goTo(page + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
