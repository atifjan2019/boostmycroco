'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BookOpen, Calendar } from 'lucide-react';

interface Tip { id: number; title: string; content: string; created_at: string; slug: string; featured_image?: string; }

export default function TipsAndTricksPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tips-and-tricks?page=${page}`).then(r => r.json()).then(d => {
      setTips(d.tips || []);
      setTotal(d.total || 0);
      setLoading(false);
    });
  }, [page]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        <div className="py-12 border-b border-border bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-extrabold mb-2 text-slate-900 tracking-tight">Tips & Tricks</h1>
            <p className="text-slate-500 font-medium">{total.toLocaleString()} community guides and tutorials</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : tips.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">No posts found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tips.map(t => (
                <Link key={t.id} href={`/tips-and-tricks/${t.slug}`} className="card overflow-hidden flex flex-col group block">
                  {t.featured_image ? (
                    <div className="h-48 overflow-hidden border-b border-slate-100">
                      <img src={t.featured_image} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-slate-100 to-slate-50 h-48 flex items-center justify-center p-6 border-b border-slate-100">
                      <BookOpen className="w-16 h-16 text-slate-300 group-hover:text-primary transition-colors duration-300 transform group-hover:scale-110" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-xl leading-snug mb-3 text-slate-900 group-hover:text-primary transition-colors line-clamp-2">{t.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                      {t.content?.replace(/<[^>]*>?/gm, '').substring(0, 150) || ''}...
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-auto pt-4 border-t border-slate-100">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
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
