'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Rocket, Gift, CircleDollarSign, Megaphone, PartyPopper, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import TurnstileWidget from '@/components/TurnstileWidget';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic', 'Hindi'];

export default function MakeARequestPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', type: 'Free', language: 'English', budget: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const turnstile = useTurnstile();

  const profile = user?.client_profile;
  const profileComplete = profile?.first_name && profile?.last_name && profile?.phone && profile?.country && (profile?.email_contact || user?.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!profileComplete) { router.push('/dashboard/profile'); return; }

    if (turnstile.isEnabled && !turnstile.token) {
      turnstile.setError('Please complete the verification.');
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://admin.boostmycroco.com';
      const res = await fetch(`${apiUrl}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, budget: parseFloat(form.budget) || 0, author_name: user?.name }),
      });
      if (res.ok) setSubmitted(true);
      else { alert('Failed to submit request.'); turnstile.reset(); }
    } catch { alert('Connection error.'); turnstile.reset(); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-lg mx-6 animate-fadeIn">
          <div className="flex justify-center mb-6 text-emerald-500"><PartyPopper className="w-16 h-16" /></div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Request Submitted!</h2>
          <p className="text-slate-600 font-medium mb-10 leading-relaxed">Your request is now live and mentors will be in touch.</p>
          <Link href="/dashboard/requests" className="btn btn-primary px-8 py-3 w-full">View My Requests</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight">Make a Request</h1>
            <p className="text-slate-500 font-medium text-lg">Describe what you need help with and choose how mentors can respond.</p>
          </div>

          {!authLoading && !user && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
              <LogIn className="w-8 h-8 text-amber-500 shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-amber-800 text-sm">You must be logged in to post a request.</p>
                <p className="text-amber-600 text-xs mt-1">Create an account or log in to submit your project request to the community.</p>
              </div>
              <div className="flex gap-2">
                <Link href="/login" className="btn btn-outline text-sm py-2 px-4 border-amber-300 text-amber-700 hover:bg-amber-100">Login</Link>
                <Link href="/register" className="btn btn-primary text-sm py-2 px-4">Register</Link>
              </div>
            </div>
          )}

          {!authLoading && user && !profileComplete && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">Complete your profile first!</p>
                <p className="text-red-600 text-xs mt-1">You need to fill in all required profile fields before you can post requests.</p>
              </div>
              <Link href="/dashboard/profile" className="btn btn-primary text-sm py-2 px-4 bg-red-600 hover:bg-red-700 border-red-600">Complete Profile</Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-8">
            <div>
              <label className="font-bold text-slate-800 text-sm mb-4 block">Request Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'Free', emoji: <Gift className="w-8 h-8" />, desc: 'Community help', activeColor: 'text-primary' },
                  { value: 'Quote', emoji: <CircleDollarSign className="w-8 h-8" />, desc: 'Paid project', activeColor: 'text-primary' },
                  { value: 'Offer', emoji: <Megaphone className="w-8 h-8" />, desc: 'Service offer', activeColor: 'text-primary' },
                ].map(t => (
                  <button
                    key={t.value} type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`p-5 rounded-xl text-center cursor-pointer transition-all duration-200 border-2
                      ${form.type === t.value
                        ? 'bg-green-50 border-primary shadow-sm shadow-green-100/50'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}>
                    <div className={`flex justify-center mb-3 ${form.type === t.value ? t.activeColor : 'text-slate-400'}`}>
                      {t.emoji}
                    </div>
                    <div className="font-bold text-sm text-slate-900 mb-1">{t.value}</div>
                    <div className="text-xs text-slate-500 font-medium">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 text-sm mb-2 block">Title *</label>
              <input className="input" required placeholder="Brief title for your request" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div>
              <label className="font-bold text-slate-800 text-sm mb-2 block">Description *</label>
              <textarea className="input resize-y min-h-[160px]" required rows={6} placeholder="Describe your problem or what you need in detail..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="font-bold text-slate-800 text-sm mb-2 block">Language</label>
                <select className="select w-full" value={form.language}
                  onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              {form.type !== 'Free' && (
                <div className="animate-fadeIn">
                  <label className="font-bold text-slate-800 text-sm mb-2 block">Budget ($)</label>
                  <input className="input" type="number" placeholder="0" min="0" required
                    value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
              )}
            </div>

            <TurnstileWidget containerRef={turnstile.containerRef} error={turnstile.error} isEnabled={turnstile.isEnabled} />

            <button type="submit" disabled={submitting || (!authLoading && !user)} className="btn btn-primary w-full py-4 text-base mt-2 shadow-md shadow-green-600/20 disabled:opacity-70">
              <Rocket className="w-5 h-5 mr-1" /> {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
