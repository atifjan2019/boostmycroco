// Browser-side consent store. Import it from client components only: it reads cookies and localStorage.
// React subscribes with useSyncExternalStore; the server snapshot is "not ready", so nothing consent-related
// renders on the server and hydration always matches.

import {
  ADSENSE_CLIENT,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  SMARTLOOK_PROJECT_KEY,
  parseConsent,
  readCookieValue,
  serializeConsent,
  type ConsentChoice,
  type StoredConsent,
} from './consent';

export interface ConsentSnapshot {
  /** False on the server and during hydration: render nothing until it is true. */
  ready: boolean;
  /** The visitor's stored choice, or null when they have not chosen yet. */
  choice: ConsentChoice | null;
  /** ISO date of the stored choice. */
  date: string | null;
  /** True when the visitor reopened the banner from "Cookie settings". */
  open: boolean;
}

const SERVER_SNAPSHOT: ConsentSnapshot = { ready: false, choice: null, date: null, open: false };

let snapshot: ConsentSnapshot | null = null;
const listeners = new Set<() => void>();

// Cookie first, then the localStorage mirror (same order as the inline Google Analytics script).
function readStoredConsent(): StoredConsent | null {
  let fromCookie: StoredConsent | null = null;
  try {
    fromCookie = parseConsent(readCookieValue(document.cookie, CONSENT_COOKIE));
  } catch {
    // Cookies blocked: fall back to the mirror.
  }
  if (fromCookie) return fromCookie;
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredConsent(consent: StoredConsent) {
  const value = serializeConsent(consent);
  try {
    document.cookie =
      `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax; Secure`;
  } catch {
    // Cookies blocked: the localStorage mirror still remembers the choice on this device.
  }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage blocked (private mode, blocked site data): the cookie alone remembers the choice.
  }
}

export function getConsentSnapshot(): ConsentSnapshot {
  if (!snapshot) {
    const stored = readStoredConsent();
    snapshot = { ready: true, choice: stored?.choice ?? null, date: stored?.date ?? null, open: false };
  }
  return snapshot;
}

export function getServerConsentSnapshot(): ConsentSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onOtherTabChange);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onOtherTabChange);
  };
}

/**
 * The visitor chose in another tab of this site (the localStorage mirror changed there). Apply it here too, so a
 * "Reject all" elsewhere stops Smartlook and Google cookies in this tab as well, and an open banner closes.
 * No reload: that could throw away what the visitor is doing in this tab. A full page load reads the new choice.
 */
function onOtherTabChange(event: StorageEvent) {
  if (event.key !== null && event.key !== CONSENT_STORAGE_KEY) return;
  const stored = readStoredConsent();
  const current = getConsentSnapshot();
  const choice = stored?.choice ?? null;
  const date = stored?.date ?? null;
  if (choice === current.choice && date === current.date) return;
  if (choice === 'granted') {
    updateGoogleConsent('granted');
  } else {
    // Rejected, or the stored choice is gone (site data cleared): back to "no consent".
    updateGoogleConsent('denied');
    pauseSmartlook();
    clearOptionalStorage();
  }
  setSnapshot({ ready: true, choice, date, open: current.open });
}

function setSnapshot(next: ConsentSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

/** "Cookie settings" in the footer: shows the banner again so the visitor can change their choice. */
export function openConsentBanner() {
  setSnapshot({ ...getConsentSnapshot(), open: true });
}

export function closeConsentBanner() {
  setSnapshot({ ...getConsentSnapshot(), open: false });
}

/* ---------- Google Consent Mode ---------- */

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

function gtag(...args: unknown[]) {
  const w = window as GtagWindow;
  if (typeof w.gtag === 'function') {
    w.gtag(...args);
    return;
  }
  // Same as the official snippet: gtag.js only reads Arguments objects from the dataLayer, not arrays.
  w.dataLayer = w.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments);
}

function updateGoogleConsent(choice: ConsentChoice) {
  gtag('consent', 'update', {
    analytics_storage: choice,
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

// First-party cookies of the optional services: Google Analytics (_ga, _ga_<id>, _gid, _gat*), AdSense
// (__gads, __gpi, __eoi) and Smartlook (SL_C_<id>_SID, seen in testing 19 Oct 2026).
const OPTIONAL_COOKIE = /^(_ga|_ga_.+|_gid|_gat.*|__gads|__gpi|__eoi|SL_C_.+)$/;
// Smartlook also keeps its session in localStorage (SL_L_<id>_SID).
const OPTIONAL_STORAGE_KEY = /^SL_L_/;

/**
 * Deletes what the optional services stored: their cookies on this host and on every parent domain (GA sets
 * _ga on .boostmycroco.com) and Smartlook's localStorage entry. Runs on "Reject all" and on every page load
 * while the choice is "denied", which also catches anything a service rewrote as the page unloaded.
 */
export function clearOptionalStorage() {
  try {
    const names = document.cookie
      .split(';')
      .map((part) => part.split('=')[0].trim())
      .filter((name) => OPTIONAL_COOKIE.test(name));
    const labels = window.location.hostname.split('.');
    const domains: (string | null)[] = [null];
    for (let i = 0; i < labels.length - 1; i++) domains.push(labels.slice(i).join('.'));
    for (const name of names) {
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
      }
    }
  } catch {
    // Cookies blocked: nothing to delete.
  }
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && OPTIONAL_STORAGE_KEY.test(key)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage blocked: nothing to delete.
  }
}

/* ---------- Scripts that need consent: AdSense and Smartlook ---------- */

// Ids are hyphenated on purpose: an element id becomes a window property, and id="smartlook" would make
// window.smartlook the <script> element, so the Smartlook snippet would skip its setup.
const ADSENSE_SCRIPT_ID = 'adsense-script';
const SMARTLOOK_SCRIPT_ID = 'smartlook-init';

const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

// Smartlook's official snippet, unchanged apart from the project key.
const SMARTLOOK_SNIPPET = `
window.smartlook||(function(d) {
  var o=smartlook=function(){ o.api.push(arguments)},h=d.getElementsByTagName('head')[0];
  var c=d.createElement('script');o.api=new Array();c.async=true;c.type='text/javascript';
  c.charset='utf-8';c.src='https://web-sdk.smartlook.com/recorder.js';h.appendChild(c);
})(document);
smartlook('init', '${SMARTLOOK_PROJECT_KEY}', { region: 'eu' });
`;

type SmartlookWindow = Window & { smartlook?: (...args: unknown[]) => void };

let smartlookPaused = false;

/** Loads AdSense once per page. Call only after the visitor accepted. */
export function loadAdSense() {
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = ADSENSE_SRC;
  document.head.appendChild(script);
}

/** Starts Smartlook once per page, or resumes it after a pause. Call only after consent, on a public page. */
export function startSmartlook() {
  const w = window as SmartlookWindow;
  if (document.getElementById(SMARTLOOK_SCRIPT_ID)) {
    if (smartlookPaused && typeof w.smartlook === 'function') {
      w.smartlook('resume');
      smartlookPaused = false;
    }
    return;
  }
  const script = document.createElement('script');
  script.id = SMARTLOOK_SCRIPT_ID;
  script.text = SMARTLOOK_SNIPPET;
  document.head.appendChild(script);
  smartlookPaused = false;
}

/** Pauses Smartlook (documented smartlook('pause')) if it runs on this page; used on members' private screens. */
export function pauseSmartlook() {
  const w = window as SmartlookWindow;
  if (smartlookPaused || !document.getElementById(SMARTLOOK_SCRIPT_ID) || typeof w.smartlook !== 'function') return;
  try {
    w.smartlook('pause');
    smartlookPaused = true;
  } catch {
    // Recorder failed to load: nothing is recording.
  }
}

/** Runs fn when the browser is idle after the page has loaded (what next/script's lazyOnload did). */
export function whenIdle(fn: () => void) {
  const run = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 4000 });
    else window.setTimeout(fn, 1);
  };
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

/* ---------- Saving a choice ---------- */

export function saveConsent(choice: ConsentChoice) {
  const consent: StoredConsent = { version: CONSENT_VERSION, choice, date: new Date().toISOString() };
  writeStoredConsent(consent);
  updateGoogleConsent(choice);

  let reload = false;
  if (choice === 'denied') {
    clearOptionalStorage();
    // AdSense cannot be unloaded from a page, so if it or Smartlook already ran here, stop recording now and
    // reload: the fresh page reads the "denied" choice and loads neither of them.
    const adsenseLoaded = !!document.getElementById(ADSENSE_SCRIPT_ID);
    const smartlookLoaded = !!document.getElementById(SMARTLOOK_SCRIPT_ID);
    if (smartlookLoaded) pauseSmartlook();
    reload = adsenseLoaded || smartlookLoaded;
  }

  setSnapshot({ ready: true, choice, date: consent.date, open: false });
  if (reload) window.location.reload();
}
