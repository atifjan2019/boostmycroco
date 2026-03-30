import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${backendUrl}/api/notifications`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error('Backend error');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}
