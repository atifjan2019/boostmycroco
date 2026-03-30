'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket, ClipboardList, Users, MessageSquareQuote, CheckCircle2, Gift, CircleDollarSign, Megaphone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Stats { total_requests: number; total_members: number; total_quotes: number; finished: number; }
interface Request { id: number; title: string; status: string; type: string; created_at: string; author_name: string; }

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Request[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setStats(d.stats);
      setRecent(d.recent_requests);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="min-h-[90vh] flex items-center justify-center pt-16 pb-20 px-6 relative overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(22,163,74,0.08)_0%,_transparent_70%)]">
          {/* Grid bg for light mode */}
          <div className="absolute inset-0 bg-[linear-gradient(var(--color-border)_1px,_transparent_1px),_linear-gradient(90deg,_var(--color-border)_1px,_transparent_1px)] bg-[size:48px_48px] opacity-40" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10 animate-fadeIn mt-10">
            <div className="inline-flex items-center gap-2 bg-white border border-border shadow-sm rounded-full px-4 py-1.5 text-xs text-primary font-bold tracking-wide mb-8">
              <span className="animate-pulse-green w-2 h-2 rounded-full bg-primary inline-block"></span>
              Crocoblock Community Marketplace
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8 text-slate-900 tracking-tight">
              Get Expert Help with<br />
              <span className="bg-gradient-to-r from-green-600 to-sky-500 bg-clip-text text-transparent">
                Crocoblock & JetEngine
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Post your request, get quotes from expert developers, and get your Crocoblock project done — Free, Quote, or Offer.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/make-a-request" className="btn btn-primary text-base px-8 py-3.5 shadow-md shadow-green-600/20">
                <Rocket className="w-5 h-5" /> Make a Request
              </Link>
              <Link href="/requests" className="btn btn-outline text-base px-8 py-3.5 bg-white shadow-sm">
                Browse Requests
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        {stats && (
          <section className="py-16 border-b border-border bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Requests', value: stats.total_requests, icon: <ClipboardList className="w-8 h-8 mx-auto" /> },
                  { label: 'Community Members', value: stats.total_members, icon: <Users className="w-8 h-8 mx-auto" /> },
                  { label: 'Quotes Submitted', value: stats.total_quotes, icon: <MessageSquareQuote className="w-8 h-8 mx-auto" /> },
                  { label: 'Completed', value: stats.finished, icon: <CheckCircle2 className="w-8 h-8 mx-auto" /> },
                ].map(s => (
                  <div key={s.label} className="text-center p-8 bg-white rounded-2xl border border-border shadow-sm">
                    <div className="text-slate-400 mb-3">{s.icon}</div>
                    <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{s.value?.toLocaleString()}</div>
                    <div className="text-sm font-semibold text-slate-500 mt-2 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900 tracking-tight">How It Works</h2>
              <p className="text-slate-600 text-lg">Three simple request types — pick what works for you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { emoji: <Gift className="w-10 h-10" />, type: 'Free', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', desc: 'Ask for free community help. Mentors respond if they can assist at no cost.' },
                { emoji: <CircleDollarSign className="w-10 h-10" />, type: 'Quote', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Post a paid request and receive competitive quotes from expert developers.' },
                { emoji: <Megaphone className="w-10 h-10" />, type: 'Offer', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', desc: 'Offer your own service or project to the community directly.' },
              ].map(t => (
                <div key={t.type} className={`p-10 rounded-3xl border shadow-sm ${t.bg} ${t.border}`}>
                  <div className={`mb-6 ${t.color}`}>{t.emoji}</div>
                  <div className={`text-2xl font-bold mb-3 ${t.color}`}>{t.type}</div>
                  <p className="text-base text-slate-700 leading-relaxed font-medium">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Requests */}
        {recent.length > 0 && (
          <section className="py-24 bg-slate-50 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recent Requests</h2>
                <Link href="/requests" className="text-primary text-sm font-bold hover:underline">View all →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recent.map(r => (
                  <Link key={r.id} href={`/requests/${r.id}`} className="card p-6 block">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span>
                      <span className={`badge badge-${r.type?.toLowerCase()}`}>{r.type}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-[15px] leading-snug mb-3 line-clamp-2">{r.title}</div>
                    <div className="text-xs font-semibold text-slate-500">
                      by {r.author_name} <span className="mx-1 font-normal">•</span> {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-green-50 to-sky-50 border border-green-100 rounded-3xl p-16 shadow-lg shadow-green-100/50">
            <h2 className="text-4xl font-extrabold mb-5 text-slate-900 tracking-tight">Ready to get started?</h2>
            <p className="text-slate-600 text-lg mb-10 font-medium">Join 232+ community members already using BoostMyCroco.</p>
            <Link href="/make-a-request" className="btn btn-primary text-base px-10 py-4 shadow-md shadow-green-600/20">
              Post Your First Request
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
