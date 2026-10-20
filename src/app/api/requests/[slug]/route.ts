import { NextResponse } from 'next/server';
import { API_BASE, isSafeSlug } from '@/lib/site';
import { isRecord, toRequestDetail } from '@/lib/public-api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const res = await fetch(`${API_BASE}/api/requests/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!res.ok) throw new Error(`Backend answered ${res.status}`);

    const data: unknown = await res.json();
    if (!isRecord(data)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(toRequestDetail(data));
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 502 });
  }
}
