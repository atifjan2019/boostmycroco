import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/site';
import { toMemberList } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 50;

function wholeNumber(value: string | null, fallback: number, max: number): number {
  const n = value !== null && /^\d{1,5}$/.test(value) ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback;
}

/** The member search on /teamwork: page, limit (1-50) and a short search text; answers with the card fields only. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = wholeNumber(searchParams.get('page'), 1, 10000);
  const limit = wholeNumber(searchParams.get('limit'), 12, MAX_LIMIT);
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  const search = (searchParams.get('search') ?? '').trim().slice(0, 100);
  if (search) query.set('search', search);

  try {
    // The Laravel API endpoint for members is /api/teamwork
    const res = await fetch(`${API_BASE}/api/teamwork?${query}`, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Backend answered ${res.status}`);
    const list = toMemberList(await res.json(), page, limit);
    return NextResponse.json({ members: list.items, total: list.total, page: list.page, lastPage: list.lastPage });
  } catch (error) {
    console.error('Error fetching members:', error instanceof Error ? error.message : error);
    return NextResponse.json({ members: [], total: 0, page, lastPage: 1 }, { status: 502 });
  }
}
