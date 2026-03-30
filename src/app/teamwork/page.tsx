'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Member { id: number; display_name: string; user_email: string; user_registered: string; slug: string; request_count: number; quote_count: number; profile_image_url?: string; }

export default function TeamworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        <div className="py-12 border-b border-border bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-extrabold mb-2 text-slate-900 tracking-tight">TeamWork</h1>
            <p className="text-slate-500 font-medium">{total.toLocaleString()} community members</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-10">
            <input
              className="input max-w-sm bg-white shadow-sm"
              placeholder="Search members..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {members.map(m => (
                <Link key={m.id} href={`/teamwork/${m.slug}`} className="card p-6 text-center block animate-fadeIn">
                  {m.profile_image_url ? (
                    <img src={m.profile_image_url} alt={m.display_name} className="w-16 h-16 rounded-full mx-auto mb-4 object-cover shadow-md shadow-slate-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-green-500 to-sky-400 flex items-center justify-center font-black text-xl text-white shadow-md shadow-green-500/20">
                      {initials(m.display_name)}
                    </div>
                  )}
                  <div className="font-bold text-slate-800 text-lg mb-1 truncate">{m.display_name}</div>
                  <div className="text-slate-500 text-xs font-medium mb-6">
                    Joined {new Date(m.user_registered).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex justify-center gap-6 pt-4 border-t border-slate-100">
                    {[
                      { label: 'Requests', value: m.request_count },
                      { label: 'Quotes', value: m.quote_count },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="font-black text-primary text-xl mb-0.5">{s.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-14">
              <button className="btn btn-outline bg-white hover:bg-slate-50" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="px-4 font-semibold text-slate-600 text-sm">{page} / {totalPages}</span>
              <button className="btn btn-outline bg-white hover:bg-slate-50" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
