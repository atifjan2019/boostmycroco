'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

// --- Validation helpers ---
const VALID_NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VALID_PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;
const GIBBERISH_REGEX = /[A-Z]{5,}|(.)\1{4,}|[^a-zA-Z0-9\s@.,!?'"-]{5,}/;

function validateField(name: string, value: string): string {
  const trimmed = value.trim();

  switch (name) {
    case 'first_name':
      if (!trimmed) return 'First name is required.';
      if (trimmed.length < 2) return 'First name must be at least 2 characters.';
      if (trimmed.length > 50) return 'First name is too long.';
      if (!VALID_NAME_REGEX.test(trimmed)) return 'Please enter a valid first name.';
      if (GIBBERISH_REGEX.test(trimmed)) return 'Please enter a real first name.';
      return '';

    case 'last_name':
      if (trimmed && !VALID_NAME_REGEX.test(trimmed)) return 'Please enter a valid last name.';
      if (trimmed && GIBBERISH_REGEX.test(trimmed)) return 'Please enter a real last name.';
      return '';

    case 'email':
      if (!trimmed) return 'Email is required.';
      if (!VALID_EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address.';
      if (GIBBERISH_REGEX.test(trimmed.split('@')[0])) return 'Please enter a real email address.';
      return '';

    case 'whatsapp_number':
      if (trimmed && !VALID_PHONE_REGEX.test(trimmed)) return 'Please enter a valid phone number.';
      return '';

    case 'message':
      if (!trimmed) return 'Message is required.';
      if (trimmed.length < 10) return 'Message must be at least 10 characters.';
      if (trimmed.length > 2000) return 'Message must be under 2000 characters.';
      if (GIBBERISH_REGEX.test(trimmed)) return 'Your message appears to contain invalid content.';
      return '';

    default:
      return '';
  }
}

function validateAll(data: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    const err = validateField(key, value);
    if (err) errors[key] = err;
  }
  return errors;
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    whatsapp_number: '',
    subject: 'general',
    message: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Honeypot field (hidden from real users, bots fill it)
  const [honeypot, setHoneypot] = useState('');

  // Turnstile
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');

  const renderTurnstile = useCallback(() => {
    if (!turnstileRef.current || !window.turnstile || !TURNSTILE_SITE_KEY) return;
    // Remove existing widget if any
    if (widgetIdRef.current) {
      try { window.turnstile!.remove(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        setTurnstileToken(token);
        setTurnstileError('');
      },
      'error-callback': () => {
        setTurnstileError('Verification failed. Please try again.');
        setTurnstileToken('');
      },
      'expired-callback': () => {
        setTurnstileToken('');
        setTurnstileError('Verification expired. Please verify again.');
      },
      theme: 'light',
    });
  }, []);

  useEffect(() => {
    // Wait for Turnstile script to load
    if (window.turnstile) {
      renderTurnstile();
      return;
    }
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        renderTurnstile();
      }
    }, 200);
    return () => clearInterval(interval);
  }, [renderTurnstile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) {
      setFieldErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Honeypot check
    if (honeypot) return;

    // Validate all fields
    const errors = validateAll(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Turnstile check
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setTurnstileError('Please complete the verification.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          turnstile_token: turnstileToken,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      setError(message);
      // Reset Turnstile on failure
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-2xl p-10 text-center border border-green-100 shadow-sm animate-fadeIn">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
        <p className="text-slate-600 font-medium">
          Thanks for reaching out, {formData.first_name}. Our team will get back to you shortly.
        </p>
        <button 
          onClick={() => {
            setSuccess(false);
            setFormData({ ...formData, message: '' });
            setTurnstileToken('');
            setTimeout(renderTurnstile, 100);
          }}
          className="mt-6 text-primary font-bold hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClasses = (name: string) =>
    `w-full px-4 py-3 rounded-xl border ${
      fieldErrors[name]
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
    } outline-none transition-all placeholder:text-slate-400 font-medium`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <Send className="w-6 h-6 text-primary" /> Send a Message
      </h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Honeypot field - hidden from real users */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website_url">Website</label>
          <input
            type="text"
            id="website_url"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="first_name" className="block text-sm font-bold text-slate-700">First Name *</label>
            <input 
              type="text" 
              id="first_name" 
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClasses('first_name')} 
              placeholder="John"
              maxLength={50}
              required
            />
            {fieldErrors.first_name && (
              <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {fieldErrors.first_name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="last_name" className="block text-sm font-bold text-slate-700">Last Name</label>
            <input 
              type="text" 
              id="last_name" 
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClasses('last_name')} 
              placeholder="Doe"
              maxLength={50}
            />
            {fieldErrors.last_name && (
              <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {fieldErrors.last_name}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-bold text-slate-700">Email Address *</label>
          <input 
            type="email" 
            id="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputClasses('email')} 
            placeholder="john@example.com"
            maxLength={100}
            required
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="whatsapp_number" className="block text-sm font-bold text-slate-700">WhatsApp Number <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input 
            type="tel" 
            id="whatsapp_number" 
            name="whatsapp_number"
            value={formData.whatsapp_number}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputClasses('whatsapp_number')} 
            placeholder="+1 (234) 567-8900"
            maxLength={20}
          />
          {fieldErrors.whatsapp_number && (
            <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.whatsapp_number}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-bold text-slate-700">Subject</label>
          <select 
            id="subject" 
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-700 font-medium bg-white"
          >
            <option value="general">General Inquiry</option>
            <option value="support">Technical Support</option>
            <option value="billing">Billing &amp; Quotes</option>
            <option value="report">Report an Issue</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm font-bold text-slate-700">
            Message *
            <span className="text-slate-400 font-normal ml-2 text-xs">
              {formData.message.length}/2000
            </span>
          </label>
          <textarea 
            id="message" 
            name="message"
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={5}
            className={`${inputClasses('message')} resize-none`} 
            placeholder="How can we help you today?"
            maxLength={2000}
            required
          ></textarea>
          {fieldErrors.message && (
            <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.message}
            </p>
          )}
        </div>

        {/* Cloudflare Turnstile widget */}
        {TURNSTILE_SITE_KEY && (
          <div className="space-y-2">
            <div ref={turnstileRef} />
            {turnstileError && (
              <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {turnstileError}
              </p>
            )}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? (
            <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
          ) : (
            <Send className="w-5 h-5" />
          )}
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
