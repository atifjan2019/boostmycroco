import { NextResponse } from 'next/server';

// Proxy admin comment endpoints to the Laravel backend

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://admin.boostmycroco.com';

  const res = await fetch(`${backendUrl}/api/admin/comments${query}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
