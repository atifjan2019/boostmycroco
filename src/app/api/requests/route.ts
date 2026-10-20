import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/site';

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  try {
    const res = await fetch(`${API_BASE}/api/requests${search}`, { next: { revalidate: 60 }, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Failed to fetch requests');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
