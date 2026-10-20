'use client';

import { useEffect, useRef, useState } from 'react';
import MemberCard from '@/components/MemberCard';
import { PAGER_BUTTON, PAGER_BUTTON_DISABLED } from '@/components/Pagination';
import type { MemberCardData } from '@/lib/public-api';

const PER_PAGE = 12;

interface Result {
  key: string;
  members: MemberCardData[];
  total: number;
  lastPage: number;
  failed: boolean;
}

function toResult(key: string, data: unknown): Result {
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const members = Array.isArray(d.members) ? (d.members as MemberCardData[]) : [];
  const total = typeof d.total === 'number' ? d.total : members.length;
  const lastPage = typeof d.lastPage === 'number' && d.lastPage >= 1 ? d.lastPage : Math.max(1, Math.ceil(total / PER_PAGE));
  return { key, members, total, lastPage, failed: false };
}

/**
 * Member search for /teamwork. With an empty search it shows the server-rendered page it wraps (`children`); with a
 * search text it loads the matching members in the browser and shows them instead, without changing the address.
 */
export default function MemberSearch({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const key = query ? new URLSearchParams({ page: String(page), limit: String(PER_PAGE), search: query }).toString() : '';

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/members?${key}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => setResult(toResult(key, data)))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, members: [], total: 0, lastPage: 1, failed: true });
      });
    return () => controller.abort();
  }, [key]);

  const current = result && result.key === key ? result : null;
  const loading = key !== '' && !current;

  const goTo = (n: number) => {
    setPage(n);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center gap-4">
        <label htmlFor="member-search" className="sr-only">Search members</label>
        <input
          id="member-search"
          type="search"
          className="input max-w-sm bg-white shadow-sm"
          placeholder="Search members..."
          value={search}
          maxLength={100}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search !== '' && (
          <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }} className="btn btn-outline bg-white hover:bg-slate-50">
            Clear search
          </button>
        )}
      </div>

      <p role="status" className="sr-only">
        {current && !current.failed ? `${current.total} ${current.total === 1 ? 'member matches' : 'members match'} your search.` : ''}
      </p>

      {!key ? (
        children
      ) : (
        <div ref={resultsRef} className="scroll-mt-24">
          {loading ? (
            <div className="flex justify-center py-20" aria-hidden="true">
              <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : current?.failed ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">
              The members could not be loaded. Please try again in a minute.
            </div>
          ) : !current || current.members.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">No members found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {current.members.map((m, i) => <MemberCard key={`${m.slug ?? "m"}-${i}`} member={m} />)}
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
