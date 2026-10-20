import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/site';

/**
 * Kept for older clients: the request page now posts quotes straight to the Laravel API so its Turnstile check
 * and rate limit see the visitor's IP. Forwards only the quote fields and the Turnstile token, and never passes
 * a server error's text through.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const token = request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const input = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

    const res = await fetch(`${API_BASE}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        request_id: input.request_id,
        price: input.price,
        message: input.message,
        ...(typeof input.turnstile_token === 'string' ? { turnstile_token: input.turnstile_token } : {}),
      })
    });

    if (res.status >= 500) {
      return NextResponse.json({ message: 'Your quote could not be sent. Please try again in a moment.' }, { status: 502 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ message: 'Your quote could not be sent. Please try again in a moment.' }, { status: 502 });
  }
}
