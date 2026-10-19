// Cookie consent (UK GDPR + PECR): settings shared by the root layout (a server component, which builds the
// Google Analytics inline script) and the browser-side consent store (src/lib/consent-store.ts).
// Keep this file free of browser globals at module level so the server can import it.

export const GA_MEASUREMENT_ID = 'G-49GRTTFY43';
export const ADSENSE_CLIENT = 'ca-pub-4404208402043493';
export const SMARTLOOK_PROJECT_KEY = '8d07c72b0956b8474c6b83331719135b9e7e9c30';

/** First-party cookie that remembers the visitor's choice; the same value is mirrored in localStorage. */
export const CONSENT_COOKIE = 'bmc_consent';
export const CONSENT_STORAGE_KEY = 'bmc_consent';

/**
 * Bump this to ask every visitor again (for example when a new optional service is added).
 * Stored choices with another version are ignored, so the banner shows again.
 */
export const CONSENT_VERSION = 1;

/** A choice is kept for 6 months (182 days), then the banner asks again. */
export const CONSENT_MAX_AGE_SECONDS = 182 * 24 * 60 * 60;

/**
 * A stored date further in the future than this (clock was wrong when the choice was made, or the value was
 * edited) is treated as invalid; otherwise the localStorage mirror, which never expires, would keep it forever.
 */
const CONSENT_FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

export type ConsentChoice = 'granted' | 'denied';

export interface StoredConsent {
  version: number;
  choice: ConsentChoice;
  /** ISO date of the choice. */
  date: string;
}

// Stored value: "<version>|<choice>|<ISO date>", for example "1|granted|2026-10-19T20:15:03.000Z".
// Every character is cookie-safe, so the cookie needs no encoding.
export function serializeConsent(consent: StoredConsent): string {
  return `${consent.version}|${consent.choice}|${consent.date}`;
}

/** Returns the stored choice, or null when it is missing, malformed, from another version or older than 6 months. */
export function parseConsent(raw: string | null | undefined, now: number = Date.now()): StoredConsent | null {
  if (!raw) return null;
  const [version, choice, date] = raw.split('|');
  if (version !== String(CONSENT_VERSION)) return null;
  if (choice !== 'granted' && choice !== 'denied') return null;
  const time = Date.parse(date ?? '');
  if (!(time > 0) || now - time > CONSENT_MAX_AGE_SECONDS * 1000) return null;
  if (time - now > CONSENT_FUTURE_TOLERANCE_MS) return null;
  return { version: CONSENT_VERSION, choice, date };
}

/** Value of the first cookie with this name in a document.cookie string (the same rule the inline GA script uses). */
export function readCookieValue(cookieString: string, name: string): string | null {
  for (const part of cookieString.split(';')) {
    const eq = part.indexOf('=');
    if (eq > -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/**
 * Members' private screens: Smartlook never starts on these, and pauses if the visitor navigates into one.
 * Matches /login, /register, /dashboard and anything under them.
 */
export function isRecordingExcludedPath(pathname: string): boolean {
  return /^\/(login|register|dashboard)(\/|$)/.test(pathname);
}

/**
 * Inline script that sets up gtag with Google Consent Mode v2.
 * Order matters: consent default (all denied) -> stored "granted" choice applied at once -> js -> config.
 * GA loads for everyone; while consent is denied it sets no cookies and sends only cookieless pings.
 * The stored-choice check repeats parseConsent() above in plain ES5, so keep the two in step.
 */
export function gaConsentInitScript(): string {
  const maxAgeMs = CONSENT_MAX_AGE_SECONDS * 1000;
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
(function () {
  function read(raw) {
    if (!raw) return null;
    var p = String(raw).split('|');
    if (p[0] !== '${CONSENT_VERSION}' || (p[1] !== 'granted' && p[1] !== 'denied')) return null;
    var t = Date.parse(p[2] || '');
    if (!(t > 0) || Date.now() - t > ${maxAgeMs} || t - Date.now() > ${CONSENT_FUTURE_TOLERANCE_MS}) return null;
    return p[1];
  }
  var fromCookie = null, fromStorage = null;
  try {
    var parts = document.cookie.split(';');
    for (var i = 0; i < parts.length; i++) {
      var eq = parts[i].indexOf('=');
      if (eq > -1 && parts[i].slice(0, eq).trim() === '${CONSENT_COOKIE}') { fromCookie = parts[i].slice(eq + 1).trim(); break; }
    }
  } catch (e) {}
  try { fromStorage = window.localStorage.getItem('${CONSENT_STORAGE_KEY}'); } catch (e) {}
  if ((read(fromCookie) || read(fromStorage)) === 'granted') {
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }
})();
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
`;
}
