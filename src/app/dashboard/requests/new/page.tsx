'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import TurnstileWidget from '@/components/TurnstileWidget';
import FieldError from '@/components/FieldError';
import { BROWSER_API_BASE } from '@/lib/browser-api';
import { focusFirstError, generalMessage, NETWORK_ERROR, readFailure } from '@/lib/form-errors';
import { isProfileComplete, MAX_AMOUNT, REQUEST_FIELDS, REQUEST_LANGUAGES, REQUEST_TYPE_HINTS, REQUEST_TYPES, requestPayload, type RequestFormValues } from '@/lib/request-form';

export default function NewRequestPage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { fieldErrors, setFieldErrors, clearFieldError, ariaFor } = useFieldErrors();
  const [form, setForm] = useState<RequestFormValues>({
    title: '',
    description: '',
    type: 'Free',
    language: 'English',
    budget: '', // empty, like /make-a-request: a Quote or Offer must have a budget typed in (Free sends 0)
  });
  const turnstile = useTurnstile();
  // Same rule as /make-a-request: a complete profile before posting.
  const profileComplete = isProfileComplete(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof RequestFormValues;
    setForm({ ...form, [name]: e.target.value });
    clearFieldError(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileComplete) { router.push('/dashboard/profile'); return; }

    if (turnstile.isEnabled && !turnstile.token) {
      turnstile.setError('Please complete the verification.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setFieldErrors({});
    try {
      const res = await fetch(`${BROWSER_API_BASE}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...requestPayload(form), ...turnstile.tokenField() }),
      });
      if (res.ok) {
        // So "My Requests" lists the new one.
        await refreshUser();
        router.push('/dashboard/requests');
        return;
      }
      const failure = await readFailure(res, {
        fields: REQUEST_FIELDS,
        fallback: 'Your request could not be posted. Please try again in a moment.',
        unauthorized: 'Your session has expired. Please log in again.',
      });
      turnstile.reset();
      setFieldErrors(failure.fields);
      setErrorMsg(generalMessage(failure));
      focusFirstError(failure.fields, REQUEST_FIELDS, 'new-request');
    } catch {
      setErrorMsg(NETWORK_ERROR);
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Post a New Request</h1>
        <p className="text-slate-500 font-medium">Describe your project so developers can send you quotes.</p>
      </div>

      {!profileComplete && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="flex-1">
            <p className="font-bold text-red-800 text-sm">Complete your profile first!</p>
            <p className="text-red-600 text-xs mt-1">You need to fill in all required profile fields before you can post requests.</p>
          </div>
          <Link href="/dashboard/profile" className="btn btn-primary text-sm py-2 px-4 bg-red-600 hover:bg-red-700 border-red-600">Complete Profile</Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col gap-6">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100" role="alert">{errorMsg}</div>
        )}

        <div>
          <label htmlFor="new-request-title" className="block text-sm font-bold text-slate-800 mb-2">Request Title</label>
          <input id="new-request-title" name="title" required minLength={3} maxLength={255} className="input" placeholder="e.g. Need help with JetEngine listing grid"
            {...ariaFor('title', 'new-request-title')}
            value={form.title} onChange={handleChange} />
          <FieldError id="new-request-title-error" message={fieldErrors.title} />
        </div>

        <div>
          <label htmlFor="new-request-description" className="block text-sm font-bold text-slate-800 mb-2">Description</label>
          <textarea id="new-request-description" name="description" maxLength={20000} rows={5} className="input resize-none" placeholder="Describe what you need in detail..."
            {...ariaFor('description', 'new-request-description')}
            value={form.description} onChange={handleChange} />
          <FieldError id="new-request-description-error" message={fieldErrors.description} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="new-request-type" className="block text-sm font-bold text-slate-800 mb-2">Type</label>
            <select id="new-request-type" name="type" className="input" value={form.type} onChange={handleChange}
              {...ariaFor('type', 'new-request-type')}>
              {REQUEST_TYPES.map(t => (
                <option key={t} value={t}>{t} ({REQUEST_TYPE_HINTS[t].toLowerCase()})</option>
              ))}
            </select>
            <FieldError id="new-request-type-error" message={fieldErrors.type} />
          </div>
          <div>
            <label htmlFor="new-request-language" className="block text-sm font-bold text-slate-800 mb-2">Language</label>
            <select id="new-request-language" name="language" className="input" value={form.language} onChange={handleChange}
              {...ariaFor('language', 'new-request-language')}>
              {REQUEST_LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            <FieldError id="new-request-language-error" message={fieldErrors.language} />
          </div>
          <div>
            <label htmlFor="new-request-budget" className="block text-sm font-bold text-slate-800 mb-2">Budget ($)</label>
            <input id="new-request-budget" name="budget" type="number" min="0" max={MAX_AMOUNT} step="0.01" className="input disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={form.type === 'Free'} required={form.type !== 'Free'} title={form.type === 'Free' ? 'Free requests have no budget' : undefined}
              {...ariaFor('budget', 'new-request-budget')}
              value={form.type === 'Free' ? '0' : form.budget} onChange={handleChange} />
            <FieldError id="new-request-budget-error" message={fieldErrors.budget} />
          </div>
        </div>

        <TurnstileWidget containerRef={turnstile.containerRef} error={turnstile.error} isEnabled={turnstile.isEnabled} />

        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={() => router.back()} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={loading || !profileComplete} className="btn btn-primary shadow-md shadow-green-600/20 px-8 disabled:opacity-70">
            {loading ? 'Submitting...' : 'Publish Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
