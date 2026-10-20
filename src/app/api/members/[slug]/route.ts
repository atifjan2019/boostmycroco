import { NextResponse } from 'next/server';
import { API_BASE, isSafeSlug } from '@/lib/site';
import { isRecord, publicMemberProfile } from '@/lib/public-api';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const res = await fetch(`${API_BASE}/api/teamwork/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!res.ok) throw new Error(`Backend answered ${res.status}`);

    const data: unknown = await res.json();
    if (!isRecord(data)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(publicMemberProfile(data));
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 502 });
  }
}
