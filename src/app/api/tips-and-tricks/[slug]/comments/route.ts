import { NextResponse } from 'next/server';
import { API_BASE, isSafeSlug } from '@/lib/site';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // Tip pages only exist for these slugs (tips-and-tricks/[slug]/page.tsx); anything else never reaches the API.
  if (!isSafeSlug(slug)) return NextResponse.json([], { status: 200 });
  try {
    const res = await fetch(`${API_BASE}/api/tips-and-tricks/${encodeURIComponent(slug)}/comments`, {
      next: { revalidate: 30 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'You must be logged in to comment.' }, { status: 401 });
    }

    // Validate content
    const content = body.content?.trim();
    if (!content || content.length < 3) {
      return NextResponse.json({ error: 'Comment must be at least 3 characters.' }, { status: 422 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment must be under 1000 characters.' }, { status: 422 });
    }

    // Forward to Laravel. The comment form now posts straight to the API (so its Turnstile check sees the visitor's
    // IP); this route stays for older clients and passes the Turnstile token on.
    const res = await fetch(`${API_BASE}/api/tips-and-tricks/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: body.content,
        parent_id: body.parent_id || null,
        ...(typeof body.turnstile_token === 'string' ? { turnstile_token: body.turnstile_token } : {}),
      }),
    });

    if (res.status >= 500) {
      return NextResponse.json({ error: 'Your comment could not be posted. Please try again in a moment.' }, { status: 502 });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: 'Your comment could not be posted. Please try again in a moment.' }, { status: 502 });
  }
}
