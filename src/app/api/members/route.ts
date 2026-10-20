import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/site';
import { publicMemberList } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 50;

/** Only the query the /teamwork page uses: page, limit (1-50) and a short search text. */
function backendQuery(searchParams: URLSearchParams): string {
  const query = new URLSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  query.set('page', String(Number.isFinite(page) && page > 0 ? page : 1));
  query.set('limit', String(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : 12));
  const search = (searchParams.get('search') || '').trim().slice(0, 100);
  if (search) query.set('search', search);
  return query.toString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // The Laravel API endpoint for members is /api/teamwork
    const res = await fetch(`${API_BASE}/api/teamwork?${backendQuery(searchParams)}`, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Backend answered ${res.status}`);

    return NextResponse.json(publicMemberList(await res.json()));
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ members: [], total: 0, page: 1 }, { status: 502 });
  }
}
