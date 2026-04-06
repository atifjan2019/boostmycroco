import { NextResponse } from 'next/server';

// --- Server-side validation ---
const VALID_NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VALID_PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;
const VALID_SUBJECTS = ['general', 'support', 'billing', 'report'];
const GIBBERISH_REGEX = /[A-Z]{5,}|(.)\1{4,}|[^a-zA-Z0-9\s@.,!?'"\-:;()\/]{5,}/;

function validateContactForm(body: Record<string, unknown>): string | null {
  const { first_name, last_name, email, whatsapp_number, subject, message } = body;

  // Required fields
  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    return 'First name is required.';
  }
  if (!VALID_NAME_REGEX.test((first_name as string).trim())) {
    return 'Invalid first name.';
  }
  if (GIBBERISH_REGEX.test((first_name as string).trim())) {
    return 'Invalid first name content.';
  }

  // Last name (optional but validated if present)
  if (last_name && typeof last_name === 'string' && last_name.trim()) {
    if (!VALID_NAME_REGEX.test(last_name.trim())) {
      return 'Invalid last name.';
    }
    if (GIBBERISH_REGEX.test(last_name.trim())) {
      return 'Invalid last name content.';
    }
  }

  // Email
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Email is required.';
  }
  if (!VALID_EMAIL_REGEX.test((email as string).trim())) {
    return 'Invalid email address.';
  }
  if (GIBBERISH_REGEX.test((email as string).trim().split('@')[0])) {
    return 'Invalid email address content.';
  }

  // WhatsApp (optional)
  if (whatsapp_number && typeof whatsapp_number === 'string' && whatsapp_number.trim()) {
    if (!VALID_PHONE_REGEX.test(whatsapp_number.trim())) {
      return 'Invalid phone number.';
    }
  }

  // Subject
  if (!subject || !VALID_SUBJECTS.includes(subject as string)) {
    return 'Invalid subject.';
  }

  // Message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return 'Message is required.';
  }
  if ((message as string).trim().length < 10) {
    return 'Message must be at least 10 characters.';
  }
  if ((message as string).trim().length > 2000) {
    return 'Message is too long.';
  }
  if (GIBBERISH_REGEX.test((message as string).trim())) {
    return 'Message contains invalid content.';
  }

  return null;
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY not set — skipping verification');
    return true; // Skip if not configured
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Server-side field validation
    const validationError = validateContactForm(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 422 });
    }

    // 2. Verify Cloudflare Turnstile token
    const turnstileToken = body.turnstile_token;
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken || typeof turnstileToken !== 'string') {
        return NextResponse.json({ error: 'Please complete the CAPTCHA verification.' }, { status: 422 });
      }
      const isHuman = await verifyTurnstile(turnstileToken);
      if (!isHuman) {
        return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 403 });
      }
    }

    // 3. Strip the turnstile token before forwarding to Laravel
    const { turnstile_token, ...formData } = body;

    // 4. Forward the sanitised request to the Laravel backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit contact form');
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred while submitting the form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
