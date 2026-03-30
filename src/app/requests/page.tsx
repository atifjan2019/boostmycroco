'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Request { id: number; title: string; description: string; status: string; type: string; language: string; author_name: string; created_at: string; budget: number; slug: string; }

const STATUS_OPTIONS = ['', 'Initied', 'Assigned', 'Finished'];
const TYPE_OPTIONS = ['', 'Free', 'Quote', 'Offer'];

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    const res = await fetch(`/api/requests?${params}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, status, type, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/30">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <div className="py-12 border-b border-border bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-extrabold mb-2 text-slate-900 tracking-tight">Requests</h1>
            <p className="text-slate-500 font-medium">{total.toLocaleString()} requests from the community</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-10 p-4 bg-white rounded-xl border border-border shadow-sm">
            <input
              className="input max-w-sm bg-white"
              placeholder="Search requests..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            <select className="select bg-white" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select bg-white" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {TYPE_OPTIONS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">No requests found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map(r => (
                <Link key={r.id} href={`/requests/${r.slug}`} className="card p-6 block flex flex-col h-full animate-fadeIn">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span>
                    <span className={`badge badge-${r.type?.toLowerCase()}`}>{r.type}</span>
                  </div>
                  <h3 className="font-bold text-[15px] leading-snug mb-3 text-slate-800 line-clamp-2">{r.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">
                    {r.description?.replace(/<[^>]*>/g, '')}
                  </p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500">by {r.author_name}</div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                      {r.budget > 0 && <span className="text-emerald-600 font-bold">${r.budget}</span>}
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-14">
              <button className="btn btn-outline bg-white hover:bg-slate-50" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="px-4 font-semibold text-slate-600 text-sm">
                {page} / {totalPages}
              </span>
              <button className="btn btn-outline bg-white hover:bg-slate-50" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
