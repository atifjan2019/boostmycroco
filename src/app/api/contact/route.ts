import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Forward the request to the Laravel backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit contact form');
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
        { error: error.message || 'An error occurred while submitting the form' }, 
        { status: 500 }
    );
  }
}
