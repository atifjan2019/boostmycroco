/**
 * Laravel API base for calls made from the browser (login, register, new requests, quotes, comments). Calling it
 * directly, rather than through a Next.js route, lets the backend see the visitor's own IP address for its
 * Turnstile check and its per-IP rate limits.
 */
export const BROWSER_API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://admin.boostmycroco.com').replace(/\/+$/, '');
