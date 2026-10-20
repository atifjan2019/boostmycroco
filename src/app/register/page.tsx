'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FieldError from '@/components/FieldError';
import { useAuth } from '@/context/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import TurnstileWidget from '@/components/TurnstileWidget';
import { BROWSER_API_BASE } from '@/lib/browser-api';
import { focusFirstError, generalMessage, NETWORK_ERROR, readFailure } from '@/lib/form-errors';

const FIELDS = ['name', 'email', 'password', 'confirm'];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { fieldErrors, setFieldErrors, clearFieldError, ariaFor } = useFieldErrors();
  const router = useRouter();
  const { login } = useAuth();
  const turnstile = useTurnstile();

  const update = (name: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
    clearFieldError(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (form.password !== form.confirm) {
      const mismatch = { confirm: "Passwords don't match." };
      setFieldErrors(mismatch);
      focusFirstError(mismatch, FIELDS, 'register');
      return;
    }

    if (turnstile.isEnabled && !turnstile.token) {
      turnstile.setError('Please complete the verification.');
      return;
    }

    setLoading(true);
    setFieldErrors({});
    try {
      const res = await fetch(`${BROWSER_API_BASE}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email,
          password: form.password,
          password_confirmation: form.confirm,
          ...turnstile.tokenField(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user);
        router.push('/dashboard/profile');
        return;
      }
      const failure = await readFailure(res, {
        fields: FIELDS,
        aliases: { password_confirmation: 'confirm' },
        fallback: 'Registration failed. Please try again in a moment.',
      });
      turnstile.reset();
      setFieldErrors(failure.fields);
      setErrorMsg(generalMessage(failure));
      focusFirstError(failure.fields, FIELDS, 'register');
    } catch {
      setErrorMsg(NETWORK_ERROR);
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 pt-24 py-12">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Join the Community</h1>
            <p className="text-slate-500 font-medium text-sm">Create an account to post requests or offer your expertise.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100" role="alert">{errorMsg}</div>
            )}

            <div>
              <label htmlFor="register-name" className="block text-sm font-bold text-slate-800 mb-2">Display Name</label>
              <input id="register-name" type="text" required maxLength={100} className="input" placeholder="e.g. John Doe" autoComplete="name"
                {...ariaFor('name', 'register-name')}
                value={form.name} onChange={e => update('name', e.target.value)} />
              <FieldError id="register-name-error" message={fieldErrors.name} />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-bold text-slate-800 mb-2">Email Address</label>
              <input id="register-email" type="email" required maxLength={255} className="input" placeholder="you@example.com" autoComplete="email"
                {...ariaFor('email', 'register-email')}
                value={form.email} onChange={e => update('email', e.target.value)} />
              <FieldError id="register-email-error" message={fieldErrors.email} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="register-password" className="block text-sm font-bold text-slate-800 mb-2">Password</label>
                <input id="register-password" type="password" required minLength={8} maxLength={255} className="input" placeholder="••••••••" autoComplete="new-password"
                  {...ariaFor('password', 'register-password')}
                  value={form.password} onChange={e => update('password', e.target.value)} />
                <FieldError id="register-password-error" message={fieldErrors.password} />
              </div>
              <div>
                <label htmlFor="register-confirm" className="block text-sm font-bold text-slate-800 mb-2">Confirm Password</label>
                <input id="register-confirm" type="password" required className="input" placeholder="••••••••" autoComplete="new-password"
                  {...ariaFor('confirm', 'register-confirm')}
                  value={form.confirm} onChange={e => update('confirm', e.target.value)} />
                <FieldError id="register-confirm-error" message={fieldErrors.confirm} />
              </div>
            </div>

            <TurnstileWidget containerRef={turnstile.containerRef} error={turnstile.error} isEnabled={turnstile.isEnabled} />

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5 mt-4 shadow-md shadow-green-600/20 disabled:opacity-70">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm font-medium text-slate-500">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Log in</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
