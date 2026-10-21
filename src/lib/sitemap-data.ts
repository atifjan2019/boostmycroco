import { PER_PAGE } from '@/lib/community';
import { toMemberList, toRequestList } from '@/lib/public-api';
import { API_BASE, isSafeSlug } from '@/lib/site';
import { TIPS_PER_PAGE, tipListLastPage } from '@/lib/tips';
import { logUpstreamFailure } from '@/lib/upstream-error';

/**
 * Server-side reads for sitemap.xml: the pages the site wants indexed, each with the date its content last changed.
 *
 * Coded against the API of 20 Oct 2026 (/api/sitemap/tips, /api/sitemap/requests, /api/sitemap/members) and still
 * working with an older API: without /api/sitemap/tips the published tips are read from the paginated tips list, and
 * without the requests or members endpoint those pages are left out while everything else is still listed.
 *
 * Every other refusal or failure throws (after one log line), so a sitemap rebuilt at runtime fails as a whole and
 * the last good copy stays in the cache instead of being replaced by a shorter one.
 */

/** Seconds the sitemap's API answers are cached: the same value as `revalidate` in src/app/sitemap.ts. */
export const SITEMAP_REVALIDATE = 3600;

/** Cache tag on every sitemap read (each read also has its own, "sitemap-<part>"), for revalidateTag. */
export const SITEMAP_TAG = 'sitemap';

/** A page for the sitemap: its path on this site and, when known, the date its content last changed (ISO 8601). */
export interface SitemapPage {
  path: string;
  lastModified: string | null;
}

/** Last page number of each paginated list, counted the way the list pages count them. */
export interface ListLastPages {
  requests: number;
  teamwork: number;
  tips: number;
}

type Obj = Record<string, unknown>;

const DIGITS_ONLY = /^\d+$/;

function isObj(value: unknown): value is Obj {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/** A whole number of at least 0 (an id), from a number or a numeric string; else null. */
function whole(value: unknown): number | null {
  const n =
    typeof value === 'number' ? value : typeof value === 'string' && /^\d{1,12}$/.test(value.trim()) ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** A date string as the API sent it, or null when it is missing or not a date. */
function date(value: unknown): string | null {
  const s = text(value);
  return s && !Number.isNaN(new Date(s).getTime()) ? s : null;
}

type Read = { found: true; data: unknown } | { found: false };

/**
 * GET one API path for the sitemap, cached for SITEMAP_REVALIDATE seconds with the sitemap tags. { found: false } for
 * a 404 (an endpoint the API does not have yet); throws for any other refusal, a network error or an answer that is
 * not JSON, after one log line.
 */
async function read(path: string, what: string, part: string): Promise<Read> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: SITEMAP_REVALIDATE, tags: [SITEMAP_TAG, `${SITEMAP_TAG}-${part}`] },
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    console.error(`[api] ${what}: ${error instanceof Error ? error.message : 'request failed'}`);
    throw error;
  }
  if (res.status === 404) return { found: false };
  if (!res.ok) {
    await logUpstreamFailure(what, url, res);
    throw new Error(`The ${what} could not be loaded (HTTP ${res.status}).`);
  }
  try {
    return { found: true, data: await res.json() };
  } catch {
    console.error(`[api] ${what}: HTTP ${res.status} but the answer is not JSON`);
    throw new Error(`The ${what} answer is not JSON.`);
  }
}

/** The JSON list a sitemap endpoint answers with; throws when the answer is anything else. */
function listOf(data: unknown, what: string): Obj[] {
  if (!Array.isArray(data)) {
    console.error(`[api] ${what}: the answer is not a list`);
    throw new Error(`The ${what} answer is not a list.`);
  }
  return data.filter(isObj);
}

/** One sitemap page per item that has a page, in the API's order, each path once (the first item wins). */
function toPages(items: Obj[], pathOf: (item: Obj) => string | null, dateOf: (item: Obj) => string | null): SitemapPage[] {
  const seen = new Set<string>();
  const pages: SitemapPage[] = [];
  for (const item of items) {
    const path = pathOf(item);
    if (path === null || seen.has(path)) continue;
    seen.add(path);
    pages.push({ path, lastModified: dateOf(item) });
  }
  return pages;
}

/* ---------------------------------------------------------------------- tips */

/**
 * The date a tip's sitemap entry gives as its last change: today its updated_at, else its created_at. This is the one
 * place to switch to a content-only date once the API sends one.
 */
export function tipLastModified(tip: Obj): string | null {
  return date(tip.updated_at) ?? date(tip.created_at);
}

/** The tip page answers only for slugs it is willing to send to the API, and with a 404 for anything else. */
function tipPath(tip: Obj): string | null {
  const slug = text(tip.slug);
  return slug !== null && isSafeSlug(slug) ? `/tips-and-tricks/${slug}` : null;
}

/** Every published tip from the paginated list (the older API, which has no /api/sitemap/tips). */
async function tipsFromList(): Promise<Obj[]> {
  const tips: Obj[] = [];
  for (let page = 1, lastPage = 1; page <= lastPage && page <= 200; page++) {
    const result = await read(`/api/tips-and-tricks?page=${page}&per_page=50`, `tips list page ${page}`, 'tips');
    if (!result.found) throw new Error(`The tips list could not be loaded (HTTP 404, page ${page}).`);
    const body = isObj(result.data) ? result.data : {};
    const items = Array.isArray(body.tips) ? body.tips.filter(isObj) : [];
    if (items.length === 0) break;
    tips.push(...items);
    lastPage = tipListLastPage(result.data, page);
  }
  return tips;
}

/** Every published tip page: GET /api/sitemap/tips [{slug, updated_at}], else the paginated list. */
export async function getTipPages(): Promise<SitemapPage[]> {
  const result = await read('/api/sitemap/tips', 'tips sitemap', 'tips');
  const tips = result.found ? listOf(result.data, 'tips sitemap') : await tipsFromList();
  return toPages(tips, tipPath, tipLastModified);
}

/* ------------------------------------------------------------------ requests */

/**
 * The address a request page answers at without a redirect (see canonicalSlug in src/app/requests/[slug]/page.tsx):
 * its slug, or its id when it has no slug the page accepts. The API reads an all-digit address as an id, so an
 * all-digit slug only works when it is the request's own id. /api/sitemap/requests sends {slug, last_activity_at}
 * only, with the id itself as the slug for a request whose page lives at its id (it never sends another request's
 * number), so an all-digit slug without an id is taken as it is; when an id is sent too, the two must match.
 */
function requestPath(request: Obj): string | null {
  const slug = text(request.slug);
  const id = whole(request.id);
  if (slug !== null && isSafeSlug(slug)) {
    return !DIGITS_ONLY.test(slug) || id === null || String(id) === slug ? `/requests/${slug}` : null;
  }
  return id !== null ? `/requests/${id}` : null;
}

/**
 * Every request page: GET /api/sitemap/requests [{slug, last_activity_at}] (last activity = the newest of created,
 * updated and the newest quote). null when the API has no such endpoint yet.
 */
export async function getRequestPages(): Promise<SitemapPage[] | null> {
  const result = await read('/api/sitemap/requests', 'requests sitemap', 'requests');
  if (!result.found) return null;
  return toPages(listOf(result.data, 'requests sitemap'), requestPath, (request) => date(request.last_activity_at));
}

/* ------------------------------------------------------------------- members */

/**
 * A profile's own address. The API reads an all-digit address as a client id (another member, so the page would
 * redirect), so such a slug is never listed.
 */
function memberPath(member: Obj): string | null {
  const slug = text(member.slug);
  return slug !== null && isSafeSlug(slug) && !DIGITS_ONLY.test(slug) ? `/teamwork/${slug}` : null;
}

/**
 * Every TeamWork profile the site lets search engines index (at least one request or quote; empty profiles are
 * noindex): GET /api/sitemap/members [{slug, last_activity_at}], which lists only those. null when the API has no
 * such endpoint yet.
 */
export async function getMemberPages(): Promise<SitemapPage[] | null> {
  const result = await read('/api/sitemap/members', 'members sitemap', 'members');
  if (!result.found) return null;
  return toPages(listOf(result.data, 'members sitemap'), memberPath, (member) => date(member.last_activity_at));
}

/* ---------------------------------------------------------------- list pages */

/** Page 1 of a list, read at the same address the list page reads (so both share one cached answer). */
async function lastPageOf(path: string, what: string, count: (data: unknown) => number): Promise<number> {
  const result = await read(path, what, 'lists');
  if (!result.found) throw new Error(`The ${what} could not be loaded (HTTP 404).`);
  return count(result.data);
}

/** How many pages /requests, /teamwork and /tips-and-tricks have, from the totals and page sizes those pages use. */
export async function getListLastPages(): Promise<ListLastPages> {
  const [requests, teamwork, tips] = await Promise.all([
    lastPageOf(`/api/requests?page=1&limit=${PER_PAGE}`, 'requests page 1', (data) => toRequestList(data, 1, PER_PAGE).lastPage),
    lastPageOf(`/api/teamwork?page=1&limit=${PER_PAGE}`, 'members page 1', (data) => toMemberList(data, 1, PER_PAGE).lastPage),
    lastPageOf(`/api/tips-and-tricks?page=1&per_page=${TIPS_PER_PAGE}`, 'tips list', (data) => tipListLastPage(data, 1)),
  ]);
  return { requests, teamwork, tips };
}
