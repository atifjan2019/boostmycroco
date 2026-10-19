'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { Cookie, X } from 'lucide-react';
import { isRecordingExcludedPath } from '@/lib/consent';
import {
  clearOptionalStorage,
  closeConsentBanner,
  getConsentSnapshot,
  getServerConsentSnapshot,
  loadAdSense,
  pauseSmartlook,
  saveConsent,
  startSmartlook,
  subscribeConsent,
  whenIdle,
} from '@/lib/consent-store';

const buttonClass =
  'inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white ' +
  'transition-colors hover:bg-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-primary-dark focus-visible:ring-offset-2';

/**
 * Cookie banner + the loader for the services that need consent (AdSense, Smartlook).
 * Rendered once in the root layout. On the server it renders nothing: the stored choice is only read in the
 * browser, so there is no hydration mismatch.
 */
export default function CookieConsent() {
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getServerConsentSnapshot);
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const visible = consent.ready && (consent.open || consent.choice === null);
  const reopened = consent.open && consent.choice !== null;

  // While the banner shows, add its height as space at the bottom of the page, so the end of every page (the
  // footer's links, form buttons) can still be scrolled above it and clicked: the banner never hides content.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!visible || !wrapper) return;
    const body = document.body;
    const previous = body.style.paddingBottom;
    const reserve = () => {
      body.style.paddingBottom = `${Math.ceil(wrapper.getBoundingClientRect().height)}px`;
    };
    reserve();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(reserve) : null;
    observer?.observe(wrapper);
    return () => {
      observer?.disconnect();
      body.style.paddingBottom = previous;
    };
  }, [visible]);

  // Leaving for a member's private screen: pause Smartlook before the browser paints the new page.
  useLayoutEffect(() => {
    if (isRecordingExcludedPath(pathname)) pauseSmartlook();
  }, [pathname]);

  // After consent: AdSense everywhere, Smartlook only on public pages. Loaded when the browser is idle.
  useEffect(() => {
    if (consent.choice !== 'granted') return;
    let cancelled = false;
    whenIdle(() => {
      if (cancelled || getConsentSnapshot().choice !== 'granted') return;
      loadAdSense();
      if (isRecordingExcludedPath(window.location.pathname)) pauseSmartlook();
      else startSmartlook();
    });
    return () => {
      cancelled = true;
    };
  }, [consent.choice, pathname]);

  // Rejected: make sure nothing the optional services stored earlier is left behind.
  useEffect(() => {
    if (consent.choice === 'denied') clearOptionalStorage();
  }, [consent.choice]);

  // Reopened from "Cookie settings": move focus into the banner, and back to the link when it closes.
  useEffect(() => {
    if (consent.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      regionRef.current?.focus();
    } else if (returnFocusRef.current) {
      if (returnFocusRef.current.isConnected) returnFocusRef.current.focus();
      returnFocusRef.current = null;
    }
  }, [consent.open]);

  if (!visible) return null;

  const decidedOn = consent.date
    ? new Date(consent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div ref={wrapperRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        ref={regionRef}
        role="region"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-text"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && reopened) closeConsentBanner();
        }}
        className="pointer-events-auto relative mx-auto max-h-[70vh] max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_-4px_32px_rgba(15,23,42,0.14)] outline-none sm:p-5 md:flex md:items-end md:gap-6"
      >
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2.5 pr-8">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
              <Cookie className="h-4 w-4 text-primary-dark" />
            </span>
            <h2 id="cookie-consent-title" className="text-sm font-bold text-slate-900 sm:text-base">
              Cookies on BoostMyCroco
            </h2>
          </div>
          <div id="cookie-consent-text" className="space-y-1.5 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
            <p>
              We&rsquo;d like to use <strong className="font-semibold text-slate-800">Google Analytics</strong> for visit
              statistics, <strong className="font-semibold text-slate-800">Google AdSense</strong> to show ads and{' '}
              <strong className="font-semibold text-slate-800">Smartlook</strong> for anonymous session recordings that
              help us improve the site. They set no cookies on your device unless you accept.
            </p>
            <p>
              Sign-in and security cookies are always on. You can change your choice at any time under
              &ldquo;Cookie settings&rdquo; in the site footer.{' '}
              <Link
                href="/privacy-policy#cookies"
                className="rounded font-semibold text-slate-900 underline decoration-primary decoration-2 underline-offset-2 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
              >
                Privacy policy
              </Link>
            </p>
            {reopened && decidedOn && (
              <p className="text-slate-500">
                Your current choice: {consent.choice === 'granted' ? 'accepted' : 'rejected'} on {decidedOn}.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid shrink-0 grid-cols-2 gap-2 md:mt-0 md:w-72">
          <button type="button" className={buttonClass} onClick={() => saveConsent('granted')}>
            Accept all
          </button>
          <button type="button" className={buttonClass} onClick={() => saveConsent('denied')}>
            Reject all
          </button>
        </div>

        {reopened && (
          <button
            type="button"
            onClick={closeConsentBanner}
            aria-label="Close cookie settings without changing your choice"
            className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
