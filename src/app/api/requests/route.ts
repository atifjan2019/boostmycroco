import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/requests${search}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch requests');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
