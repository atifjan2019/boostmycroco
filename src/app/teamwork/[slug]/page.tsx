'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface MemberDetail {
  id: number; display_name: string; user_email: string; user_registered: string;
  slug: string; request_count: number; quote_count: number; profile_image_url?: string;
  requests: { id: number; title: string; status: string; type: string; created_at: string; slug?: string }[];
  quotes: { id: number; price: number; created_at: string; request_title: string; }[];
}

export default function MemberProfilePage() {
  const { slug } = useParams();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetch(`/api/members/${slug}`).then(r => r.json()).then(d => { setMember(d); setLoading(false); });
  }, [slug]);

  const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  if (loading) return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-32">
        <svg className="animate-spin w-10 h-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
      <Footer />
    </div>
  );
  if (!member || (member as any).error) return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <div className="flex-1 text-center py-32 text-slate-500 font-medium">Member not found.</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        {/* Profile header */}
        <div className="bg-white border-b border-border shadow-sm py-16">
          <div className="max-w-7xl mx-auto px-6 flex items-start gap-8 flex-wrap">
            {member.profile_image_url ? (
              <img src={member.profile_image_url} alt={member.display_name} className="w-24 h-24 rounded-full flex-shrink-0 object-cover shadow-lg shadow-slate-200" />
            ) : (
              <div className="w-24 h-24 rounded-full flex-shrink-0 bg-gradient-to-br from-green-500 to-sky-400 flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-green-500/20">
                {initials(member.display_name)}
              </div>
            )}
            <div className="flex-1 pt-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{member.display_name}</h1>
              <div className="text-slate-500 font-medium text-sm mb-6 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Member since {new Date(member.user_registered).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </div>
              <div className="flex gap-8">
                {[
                  { label: 'Requests Posted', value: member.request_count },
                  { label: 'Quotes Given', value: member.quote_count },
                ].map(s => (
                  <div key={s.label}>
                    <div className="font-black text-3xl text-primary mb-1">{s.value}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Requests */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Recent Requests
            </h2>
            {member.requests?.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">No requests yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {member.requests.map(r => (
                  <Link key={r.id} href={`/requests/${r.slug || r.id}`} className="card p-5 block">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span>
                      <span className="text-slate-400 text-xs font-semibold">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-[15px] leading-snug">{r.title}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quotes */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Recent Quotes
            </h2>
            {member.quotes?.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">No quotes yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {member.quotes.map(q => (
                  <div key={q.id} className="card p-5">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className="font-bold text-slate-800 text-[15px] leading-snug">{q.request_title}</span>
                      {q.price > 0 && <span className="text-emerald-600 font-black text-sm shrink-0">${q.price}</span>}
                    </div>
                    <div className="text-slate-400 text-xs font-semibold">{new Date(q.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          <Link href="/teamwork" className="inline-flex items-center text-slate-500 text-sm font-semibold hover:text-primary transition-colors">
            ← Back to TeamWork
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
