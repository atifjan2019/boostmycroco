import { API_BASE } from '@/lib/site';
import { logUpstreamFailure } from '@/lib/upstream-error';

/**
 * Server-side lookups used only to build page metadata for the client-rendered request and
 * member pages. Only the fields listed below are read; nothing else from the API response
 * (for example email addresses) is ever placed in the page.
 */

export type Lookup<T> = { status: 'found'; data: T } | { status: 'missing' } | { status: 'error' };

const REVALIDATE = 300;

async function lookup<T>(path: string): Promise<Lookup<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: REVALIDATE },
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) return { status: 'missing' };
    if (!res.ok) {
      await logUpstreamFailure(path, `${API_BASE}${path}`, res);
      return { status: 'error' };
    }
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null || Array.isArray(data) || 'error' in data) return { status: 'missing' };
    return { status: 'found', data: data as T };
  } catch {
    return { status: 'error' };
  }
}

export interface CommunityRequest {
  id?: number;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  type?: string | null;
}

export interface MemberProfile {
  display_name?: string | null;
  slug?: string | null;
  request_count?: number | null;
  quote_count?: number | null;
  skills?: unknown;
}

export function getCommunityRequest(slug: string): Promise<Lookup<CommunityRequest>> {
  return lookup<CommunityRequest>(`/api/requests/${encodeURIComponent(slug)}`);
}

export function getMemberProfile(slug: string): Promise<Lookup<MemberProfile>> {
  return lookup<MemberProfile>(`/api/teamwork/${encodeURIComponent(slug)}`);
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
