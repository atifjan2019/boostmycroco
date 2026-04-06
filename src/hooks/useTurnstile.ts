'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const render = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !TURNSTILE_SITE_KEY) return;
    if (widgetIdRef.current) {
      try { window.turnstile!.remove(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (t: string) => { setToken(t); setError(''); },
      'error-callback': () => { setError('Verification failed. Please try again.'); setToken(''); },
      'expired-callback': () => { setToken(''); setError('Verification expired. Please verify again.'); },
      theme: 'light',
    });
  }, []);

  useEffect(() => {
    if (window.turnstile) { render(); return; }
    const interval = setInterval(() => {
      if (window.turnstile) { clearInterval(interval); render(); }
    }, 200);
    return () => clearInterval(interval);
  }, [render]);

  const reset = useCallback(() => {
    setToken('');
    setError('');
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  const rerender = useCallback(() => {
    setToken('');
    setError('');
    setTimeout(render, 100);
  }, [render]);

  return {
    containerRef,
    token,
    error,
    setError,
    reset,
    rerender,
    isEnabled: !!TURNSTILE_SITE_KEY,
  };
}

export { TURNSTILE_SITE_KEY };
