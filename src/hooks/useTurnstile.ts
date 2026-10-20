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

/**
 * Cloudflare Turnstile for one form.
 *
 * - Put <TurnstileWidget containerRef={t.containerRef} …/> inside the form. The widget is drawn when that
 *   element appears, so forms that show up after a fetch (the quote form, the comment form) get one too.
 * - Spread t.tokenField() into the JSON body. It is { turnstile_token } once the visitor has passed the check,
 *   and {} when no site key is configured (the backend lets the request through when its secret is unset).
 * - Tokens work once. After a submit that reached the server and left the form on screen, call t.reset()
 *   so the next submit gets a fresh token.
 */
export function useTurnstile() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [generation, setGeneration] = useState(0);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  // Callback ref: React calls it with the element when the widget's container mounts and with null when it goes.
  const containerRef = useCallback((el: HTMLDivElement | null) => setContainer(el), []);

  useEffect(() => {
    if (!container || !TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    let widgetId: string | null = null;

    const mount = () => {
      if (cancelled) return true;
      // Only the real Turnstile API: an element with id="turnstile" would also show up as window.turnstile.
      if (typeof window.turnstile?.render !== 'function') return false;
      try {
        widgetId = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (t: string) => { setToken(t); setError(''); },
          'error-callback': () => { setError('Verification failed. Please try again.'); setToken(''); },
          'expired-callback': () => { setToken(''); setError('Verification expired. Please verify again.'); },
          theme: 'light',
        });
        widgetIdRef.current = widgetId;
      } catch {
        // A bad site key or a broken script throws here; show a message instead of breaking the page.
        setError('The verification box could not load. Please refresh the page and try again.');
      }
      return true;
    };

    // The Turnstile script loads async from <head>; wait for it when it is not there yet.
    let interval: ReturnType<typeof setInterval> | undefined;
    if (!mount()) {
      interval = setInterval(() => { if (mount()) clearInterval(interval); }, 200);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (widgetId && window.turnstile) {
        try { window.turnstile.remove(widgetId); } catch {}
      }
      if (widgetIdRef.current === widgetId) widgetIdRef.current = null;
      setToken('');
    };
  }, [container, generation]);

  /** Clears the token and runs the check again, so the next submit carries a fresh token. */
  const reset = useCallback(() => {
    setToken('');
    setError('');
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch {}
    }
  }, []);

  /** Draws a new widget (for a form that was replaced, e.g. "Send another message"). */
  const rerender = useCallback(() => {
    setToken('');
    setError('');
    setGeneration(g => g + 1);
  }, []);

  /** The body field the backend reads: { turnstile_token } when there is a token, else nothing. */
  const tokenField = useCallback(
    (): { turnstile_token?: string } => (TURNSTILE_SITE_KEY && token ? { turnstile_token: token } : {}),
    [token],
  );

  return {
    containerRef,
    token,
    error,
    setError,
    reset,
    rerender,
    tokenField,
    isEnabled: !!TURNSTILE_SITE_KEY,
  };
}

export { TURNSTILE_SITE_KEY };
