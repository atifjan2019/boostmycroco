import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://admin.boostmycroco.com';
    const res = await fetch(`${backendUrl}/api/tips-and-tricks/${slug}/comments`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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

    // Verify Turnstile
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const turnstileToken = body.turnstile_token;
      if (!turnstileToken) {
        return NextResponse.json({ error: 'Please complete the CAPTCHA verification.' }, { status: 422 });
      }
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: turnstileSecret, response: turnstileToken }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: 'CAPTCHA verification failed.' }, { status: 403 });
      }
    }

    // Forward to Laravel backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://admin.boostmycroco.com';
    const { turnstile_token, ...formData } = body;
    
    const res = await fetch(`${backendUrl}/api/tips-and-tricks/${slug}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to post comment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
