import { NextResponse } from 'next/server';
import { safeMessage } from '@/lib/form-errors';
import { API_BASE } from '@/lib/site';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Server-side field validation
    const validationError = validateContactForm(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 422 });
    }

    // 2. The Turnstile token is passed on, never checked here: Laravel checks it on POST /api/contact, and a token
    //    works only once, so checking it here as well would make Laravel's check fail.
    //    The contact form itself now posts straight to Laravel (ContactForm.tsx), so the per-connection limit and the
    //    Turnstile check see the visitor's IP; this route stays for pages loaded before that change.
    const { first_name, last_name, email, whatsapp_number, subject, message, turnstile_token } = body;
    const payload = {
      first_name, last_name, email, whatsapp_number, subject, message,
      ...(typeof turnstile_token === 'string' && turnstile_token ? { turnstile_token } : {}),
    };

    // 3. Forward the checked fields to the Laravel backend
    const res = await fetch(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Validation and rate-limit answers are passed on as one short message; server errors never are.
      if (res.status === 429) {
        const limited = await res.json().catch(() => ({}));
        return NextResponse.json({ error: safeMessage(limited?.message) || 'Too many messages. Please wait a minute and try again.' }, { status: 429 });
      }
      if (res.status >= 400 && res.status < 500) {
        const errorData = await res.json().catch(() => ({}));
        const errors = errorData && typeof errorData.errors === 'object' && errorData.errors ? Object.values(errorData.errors) : [];
        const first = errors.map(v => safeMessage(Array.isArray(v) ? v[0] : v)).find(Boolean);
        const message = first || safeMessage(errorData.message) || 'Please check the form and try again.';
        return NextResponse.json({ error: message }, { status: res.status });
      }
      throw new Error(`Backend answered ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Your message could not be sent. Please try again in a moment.' }, { status: 502 });
  }
}
