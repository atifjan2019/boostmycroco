import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    const res = await fetch(`${backendUrl}/api/requests/${slug}`, { next: { revalidate: 60 } });
    if (res.status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!res.ok) throw new Error('Backend error');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}
