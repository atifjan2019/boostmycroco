import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/site';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`, { next: { revalidate: 60 }, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
