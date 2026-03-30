import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    const res = await fetch(`${backendUrl}/api/tips-and-tricks${query}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Backend error');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tips:', error);
    return NextResponse.json({ tips: [], total: 0 }, { status: 500 });
  }
}
