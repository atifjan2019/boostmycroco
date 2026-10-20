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

const FIELDS = ['email', 'password'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { fieldErrors, setFieldErrors, clearFieldError, ariaFor } = useFieldErrors();
  const router = useRouter();
  const { login } = useAuth();
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (turnstile.isEnabled && !turnstile.token) {
      turnstile.setError('Please complete the verification.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setFieldErrors({});
    try {
      const res = await fetch(`${BROWSER_API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password, ...turnstile.tokenField() }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user);
        router.push('/dashboard');
        return;
      }
      const failure = await readFailure(res, { fields: FIELDS, fallback: 'Login failed. Please try again in a moment.' });
      turnstile.reset();
      setFieldErrors(failure.fields);
      setErrorMsg(generalMessage(failure));
      focusFirstError(failure.fields, FIELDS, 'login');
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
      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10 animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-500 font-medium text-sm">Log in to manage your requests and profile.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100" role="alert">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-slate-800 mb-2">Email Address</label>
              <input id="login-email" type="email" required className="input" placeholder="you@example.com" autoComplete="email"
                {...ariaFor('email', 'login-email')}
                value={email} onChange={e => { setEmail(e.target.value); clearFieldError('email'); }} />
              <FieldError id="login-email-error" message={fieldErrors.email} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="login-password" className="block text-sm font-bold text-slate-800">Password</label>
                <Link href="/forgot-password" className="text-primary text-xs font-bold hover:underline">Forgot?</Link>
              </div>
              <input id="login-password" type="password" required className="input" placeholder="••••••••" autoComplete="current-password"
                {...ariaFor('password', 'login-password')}
                value={password} onChange={e => { setPassword(e.target.value); clearFieldError('password'); }} />
              <FieldError id="login-password-error" message={fieldErrors.password} />
            </div>

            <TurnstileWidget containerRef={turnstile.containerRef} error={turnstile.error} isEnabled={turnstile.isEnabled} />

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5 mt-2 shadow-md shadow-green-600/20 disabled:opacity-70">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Register now</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
