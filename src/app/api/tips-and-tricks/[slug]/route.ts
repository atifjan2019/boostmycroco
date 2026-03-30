import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tips-and-tricks/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch tip');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
