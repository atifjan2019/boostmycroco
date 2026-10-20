import { API_BASE } from '@/lib/site';
import { logUpstreamFailure } from '@/lib/upstream-error';
import {
  isRecord,
  toMemberList,
  toMemberProfile,
  toRequestCard,
  toRequestDetail,
  toRequestList,
  type ListPage,
  type MemberCardData,
  type MemberProfileData,
  type RequestCardData,
  type RequestDetailData,
} from '@/lib/public-api';

/**
 * Server-side reads of the community API for the request and member pages. Every answer goes through the field
 * whitelists in src/lib/public-api.ts, so nothing else from the API (for example email addresses) is ever placed
 * in a page.
 */

export type Lookup<T> = { status: 'found'; data: T } | { status: 'missing' } | { status: 'error' };

/** API answers are cached for 5 minutes (and refreshed at once when the backend calls /api/revalidate). */
export const COMMUNITY_REVALIDATE = 300;

/** Rows per page on /requests and /teamwork. */
export const PER_PAGE = 12;

async function getJson(path: string, what: string): Promise<Lookup<unknown>> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: COMMUNITY_REVALIDATE },
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) return { status: 'missing' };
    if (!res.ok) {
      await logUpstreamFailure(what, url, res);
      return { status: 'error' };
    }
    return { status: 'found', data: await res.json() };
  } catch (error) {
    console.error(`[api] ${what}: ${error instanceof Error ? error.message : 'request failed'}`);
    return { status: 'error' };
  }
}

/** One request by slug or id (the API also finds it by the "-<id>" at the end of an old or mistyped slug). */
export async function getRequestDetail(slug: string): Promise<Lookup<RequestDetailData>> {
  const result = await getJson(`/api/requests/${encodeURIComponent(slug)}`, `request ${slug}`);
  if (result.status !== 'found') return result;
  return isRecord(result.data) ? { status: 'found', data: toRequestDetail(result.data) } : { status: 'missing' };
}

/** One member by slug (the API also matches old and loose member addresses). */
export async function getMemberProfile(slug: string): Promise<Lookup<MemberProfileData>> {
  const result = await getJson(`/api/teamwork/${encodeURIComponent(slug)}`, `member ${slug}`);
  if (result.status !== 'found') return result;
  return isRecord(result.data) ? { status: 'found', data: toMemberProfile(result.data) } : { status: 'missing' };
}

/** One page of the requests list, newest first. Throws when the API cannot be read (the page shows its error view). */
export async function getRequestsPage(page: number): Promise<ListPage<RequestCardData>> {
  const result = await getJson(`/api/requests?page=${page}&limit=${PER_PAGE}`, `requests page ${page}`);
  if (result.status !== 'found') throw new Error(`The requests list could not be loaded (page ${page}).`);
  return toRequestList(result.data, page, PER_PAGE);
}

/** One page of the TeamWork members list. Throws when the API cannot be read. */
export async function getMembersPage(page: number): Promise<ListPage<MemberCardData>> {
  const result = await getJson(`/api/teamwork?page=${page}&limit=${PER_PAGE}`, `members page ${page}`);
  if (result.status !== 'found') throw new Error(`The members list could not be loaded (page ${page}).`);
  return toMemberList(result.data, page, PER_PAGE);
}

/**
 * The newest requests for the home page, from the requests list (which carries the archived flag), else from the
 * stats answer the home page already reads. [] when neither can be read.
 */
export async function getRecentRequests(fallback: unknown, limit = 6): Promise<RequestCardData[]> {
  const result = await getJson(`/api/requests?page=1&limit=${limit}`, 'recent requests');
  if (result.status === 'found') {
    const items = toRequestList(result.data, 1, limit).items;
    if (items.length > 0) return items.slice(0, limit);
  }
  return Array.isArray(fallback)
    ? fallback.filter(isRecord).map(toRequestCard).slice(0, limit)
    : [];
}

export function plural(count: number, word: string): string {
  return `${count.toLocaleString('en-GB')} ${word}${count === 1 ? '' : 's'}`;
}
