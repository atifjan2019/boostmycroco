'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Rocket, Gift, CircleDollarSign, Megaphone, PartyPopper, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import TurnstileWidget from '@/components/TurnstileWidget';
import FieldError from '@/components/FieldError';
import { BROWSER_API_BASE } from '@/lib/browser-api';
import { focusFirstError, generalMessage, NETWORK_ERROR, readFailure } from '@/lib/form-errors';
import { isProfileComplete, MAX_AMOUNT, REQUEST_FIELDS, REQUEST_LANGUAGES, REQUEST_TYPE_HINTS, REQUEST_TYPES, requestPayload, type RequestFormValues } from '@/lib/request-form';
import { isSafeSlug } from '@/lib/site';

const TYPE_ICONS = {
  Free: <Gift className="w-8 h-8" />,
  Quote: <CircleDollarSign className="w-8 h-8" />,
  Offer: <Megaphone className="w-8 h-8" />,
};

export default function MakeARequestPage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<RequestFormValues>({ title: '', description: '', type: 'Free', language: 'English', budget: '' });
  const [submitted, setSubmitted] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { fieldErrors, setFieldErrors, clearFieldError, ariaFor } = useFieldErrors();
  const turnstile = useTurnstile();

  const update = (name: keyof RequestFormValues, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
    clearFieldError(name);
  };

  const profileComplete = isProfileComplete(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!profileComplete) { router.push('/dashboard/profile'); return; }

    if (turnstile.isEnabled && !turnstile.token) {
      turnstile.setError('Please complete the verification.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFieldErrors({});
    try {
      const res = await fetch(`${BROWSER_API_BASE}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...requestPayload(form), ...turnstile.tokenField() }),
      });
      if (res.ok) {
        // 201 with the new request, including the slug its page lives at.
        const created: unknown = await res.json().catch(() => null);
        const slug = created && typeof created === 'object' ? (created as { slug?: unknown }).slug : null;
        setNewSlug(isSafeSlug(slug) ? slug : '');
        setSubmitted(true);
        void refreshUser();
        return;
      }
      // The budget input is only on screen for paid types.
      const visible = REQUEST_FIELDS.filter(f => f !== 'budget' || form.type !== 'Free');
      const failure = await readFailure(res, {
        fields: visible,
        fallback: 'Your request could not be posted. Please try again in a moment.',
        unauthorized: 'Your session has expired. Please log in again.',
      });
      turnstile.reset();
      setFieldErrors(failure.fields);
      setFormError(generalMessage(failure));
      focusFirstError(failure.fields, REQUEST_FIELDS, 'make-request');
    } catch {
      setFormError(NETWORK_ERROR);
      turnstile.reset();
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-lg mx-6 animate-fadeIn">
          <div className="flex justify-center mb-6 text-emerald-500"><PartyPopper className="w-16 h-16" /></div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Request Submitted!</h2>
          <p className="text-slate-600 font-medium mb-10 leading-relaxed">Your request is now live and mentors will be in touch.</p>
          <div className="flex flex-col gap-3">
            {newSlug && <Link href={`/requests/${newSlug}`} className="btn btn-primary px-8 py-3 w-full">View Your Request</Link>}
            <Link href="/dashboard/requests" className={`btn ${newSlug ? 'btn-outline' : 'btn-primary'} px-8 py-3 w-full`}>View My Requests</Link>
          </div>
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
            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100" role="alert">{formError}</div>
            )}

            <div>
              <label className="font-bold text-slate-800 text-sm mb-4 block">Request Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {REQUEST_TYPES.map((value, i) => (
                  <button
                    key={value} type="button" id={i === 0 ? 'make-request-type' : undefined}
                    aria-pressed={form.type === value}
                    onClick={() => update('type', value)}
                    className={`p-5 rounded-xl text-center cursor-pointer transition-all duration-200 border-2
                      ${form.type === value
                        ? 'bg-green-50 border-primary shadow-sm shadow-green-100/50'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}>
                    <div className={`flex justify-center mb-3 ${form.type === value ? 'text-primary' : 'text-slate-400'}`}>
                      {TYPE_ICONS[value]}
                    </div>
                    <div className="font-bold text-sm text-slate-900 mb-1">{value}</div>
                    <div className="text-xs text-slate-500 font-medium">{REQUEST_TYPE_HINTS[value]}</div>
                  </button>
                ))}
              </div>
              <FieldError id="make-request-type-error" message={fieldErrors.type} />
            </div>

            <div>
              <label htmlFor="make-request-title" className="font-bold text-slate-800 text-sm mb-2 block">Title *</label>
              <input id="make-request-title" className="input" required minLength={3} maxLength={255} placeholder="Brief title for your request" value={form.title}
                {...ariaFor('title', 'make-request-title')}
                onChange={e => update('title', e.target.value)} />
              <FieldError id="make-request-title-error" message={fieldErrors.title} />
            </div>

            <div>
              <label htmlFor="make-request-description" className="font-bold text-slate-800 text-sm mb-2 block">Description *</label>
              <textarea id="make-request-description" className="input resize-y min-h-[160px]" required maxLength={20000} rows={6} placeholder="Describe your problem or what you need in detail..."
                {...ariaFor('description', 'make-request-description')}
                value={form.description} onChange={e => update('description', e.target.value)} />
              <FieldError id="make-request-description-error" message={fieldErrors.description} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="make-request-language" className="font-bold text-slate-800 text-sm mb-2 block">Language</label>
                <select id="make-request-language" className="select w-full" value={form.language}
                  {...ariaFor('language', 'make-request-language')}
                  onChange={e => update('language', e.target.value)}>
                  {REQUEST_LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
                <FieldError id="make-request-language-error" message={fieldErrors.language} />
              </div>
              {form.type !== 'Free' && (
                <div className="animate-fadeIn">
                  <label htmlFor="make-request-budget" className="font-bold text-slate-800 text-sm mb-2 block">Budget ($)</label>
                  <input id="make-request-budget" className="input" type="number" placeholder="0" min="0" max={MAX_AMOUNT} step="0.01" required
                    {...ariaFor('budget', 'make-request-budget')}
                    value={form.budget} onChange={e => update('budget', e.target.value)} />
                  <FieldError id="make-request-budget-error" message={fieldErrors.budget} />
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
