import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://admin.boostmycroco.com';
    const res = await fetch(`${backendUrl}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
