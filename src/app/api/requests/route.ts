import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/site';
import { toRequestList } from '@/lib/public-api';
import { REQUEST_TYPES } from '@/lib/request-form';
import { STATUS_FILTERS } from '@/lib/request-status';

const MAX_LIMIT = 50;
const STATUSES = new Set(STATUS_FILTERS.map((s) => s.value));
const TYPES = new Set<string>(REQUEST_TYPES);

function wholeNumber(value: string | null, fallback: number, max: number): number {
  const n = value !== null && /^\d{1,5}$/.test(value) ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback;
}

/**
 * The filtered list on /requests (the page's filter box calls this). Passes on only page, limit (1-50), a known
 * status ("Initied" also finds the WordPress-era "publish" rows on the API's side), a known type and a short search
 * text, and answers with the card fields only.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = wholeNumber(searchParams.get('page'), 1, 10000);
  const limit = wholeNumber(searchParams.get('limit'), 12, MAX_LIMIT);
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  const status = searchParams.get('status') ?? '';
  if (STATUSES.has(status)) query.set('status', status);
  const type = searchParams.get('type') ?? '';
  if (TYPES.has(type)) query.set('type', type);
  const search = (searchParams.get('search') ?? '').trim().slice(0, 100);
  if (search) query.set('search', search);

  try {
    const res = await fetch(`${API_BASE}/api/requests?${query}`, { next: { revalidate: 60 }, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Backend answered ${res.status}`);
    const list = toRequestList(await res.json(), page, limit);
    return NextResponse.json({ requests: list.items, total: list.total, page: list.page, lastPage: list.lastPage });
  } catch (error) {
    console.error('Error fetching requests:', error instanceof Error ? error.message : error);
    return NextResponse.json({ requests: [], total: 0, page, lastPage: 1, error: 'Failed to fetch' }, { status: 502 });
  }
}
