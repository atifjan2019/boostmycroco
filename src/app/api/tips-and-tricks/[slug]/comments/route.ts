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
  } catch {
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

    // Forward to Laravel backend (no Turnstile for comments — auth-gated)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://admin.boostmycroco.com';

    const res = await fetch(`${backendUrl}/api/tips-and-tricks/${slug}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: body.content,
        parent_id: body.parent_id || null,
      }),
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
