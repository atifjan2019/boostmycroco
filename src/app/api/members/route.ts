import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://admin.boostmycroco.com';
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    // The Laravel API endpoint for members is /api/teamwork
    const res = await fetch(`${backendUrl}/api/teamwork${query}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Backend error');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ members: [], total: 0, page: 1, limit: 12 }, { status: 500 });
  }
}
