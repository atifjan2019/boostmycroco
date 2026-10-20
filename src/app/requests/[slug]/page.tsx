'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { User, Calendar, CircleDollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import TurnstileWidget from '@/components/TurnstileWidget';
import FieldError from '@/components/FieldError';
import { BROWSER_API_BASE } from '@/lib/browser-api';
import { focusFirstError, generalMessage, NETWORK_ERROR, readFailure } from '@/lib/form-errors';
import { MAX_AMOUNT } from '@/lib/request-form';
import { safeMemberHtml } from '@/lib/safe-html';

// The fields /api/requests/[slug] returns (see src/lib/public-api.ts).
interface Quote { id: number; name: string; price: number; message: string; created_at: string; }
interface Request {
  id: number; title: string; description: string; status: string; type: string;
  language: string; author_name: string; created_at: string; budget: number;
  quotes: Quote[];
  /** The guide written for this request, if one is published. */
  related_tip?: { title: string; slug: string } | null;
}

const QUOTE_FIELDS = ['price', 'message'];

/** The quote in a 201 answer from POST /api/quotes ({message, quote}), with only the fields this page shows. */
function createdQuote(data: unknown): Quote | null {
  const q = data && typeof data === 'object' ? (data as { quote?: unknown }).quote : null;
  if (!q || typeof q !== 'object') return null;
  const o = q as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: typeof o.name === 'string' ? o.name : '',
    price: Number(o.price) || 0,
    message: typeof o.message === 'string' ? o.message : '',
    created_at: typeof o.created_at === 'string' ? o.created_at : new Date().toISOString(),
  };
}

export default function RequestDetailPage() {
  const { slug } = useParams();
  const [req, setReq] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const { fieldErrors, setFieldErrors, clearFieldError, ariaFor } = useFieldErrors();
  const turnstile = useTurnstile();

  // Member HTML, cleaned again in the browser (src/lib/safe-html.ts) before it goes into the page.
  const descriptionHtml = useMemo(() => safeMemberHtml(req?.description), [req]);
  const quoteHtml = useMemo(() => new Map((req?.quotes ?? []).map(q => [q.id, safeMemberHtml(q.message)])), [req]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/requests/${slug}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setReq(d && typeof d === 'object' && 'id' in d ? (d as Request) : null))
      .catch(() => setReq(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-32">
        <svg className="animate-spin w-10 h-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
      <Footer />
    </div>
  );
  if (!req) return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <div className="flex-1 text-center py-32 text-slate-500 font-medium">Request not found.</div>
      <Footer />
    </div>
  );

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (turnstile.isEnabled && !turnstile.token) {
      turnstile.setError('Please complete the verification.');
      return;
    }

    setSubmitting(true);
    setSubmitMessage({ type: '', text: '' });
    setFieldErrors({});
    try {
      const res = await fetch(`${BROWSER_API_BASE}/api/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: req.id,
          price: parseFloat(quotePrice) || 0,
          message: quoteMessage,
          ...turnstile.tokenField(),
        })
      });
      if (res.ok) {
        // The token is spent either way.
        turnstile.reset();
        setQuotePrice('');
        setQuoteMessage('');
        // Shown from the API's answer: the page's own data is cached for up to a minute, so a reload could miss it.
        const added = createdQuote(await res.json().catch(() => null));
        if (added) {
          setReq(r => (r ? { ...r, quotes: [...(r.quotes || []), added] } : r));
          setSubmitMessage({ type: 'success', text: 'Quote submitted successfully! It is listed below.' });
        } else {
          setSubmitMessage({ type: 'success', text: 'Quote submitted successfully!' });
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        const failure = await readFailure(res, {
          fields: QUOTE_FIELDS,
          fallback: 'Your quote could not be sent. Please try again in a moment.',
          unauthorized: 'Your session has expired. Please log in again.',
        });
        turnstile.reset();
        // The API answers 403 when the member has no profile yet.
        const text = res.status === 403 && /profile/i.test(failure.message)
          ? 'Please complete your profile (Dashboard > Profile Settings) before sending a quote.'
          : generalMessage(failure);
        setFieldErrors(failure.fields);
        setSubmitMessage(text ? { type: 'error', text } : { type: '', text: '' });
        focusFirstError(failure.fields, QUOTE_FIELDS, 'quote');
      }
    } catch {
      setSubmitMessage({ type: 'error', text: NETWORK_ERROR });
      turnstile.reset();
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link href="/requests" className="inline-flex items-center text-slate-500 text-sm font-semibold hover:text-primary transition-colors mb-8">
            ← Back to Requests
          </Link>

          <div className="flex gap-3 mb-6 flex-wrap">
            <span className={`badge badge-${req.status?.toLowerCase()}`}>{req.status}</span>
            <span className={`badge badge-${req.type?.toLowerCase()}`}>{req.type}</span>
            {req.language && <span className="bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">{req.language}</span>}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight">{req.title}</h1>

          <div className="flex gap-6 text-slate-500 text-sm font-medium mb-10 flex-wrap pb-8 border-b border-slate-200">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {req.author_name}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {req.budget > 0 && <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><CircleDollarSign className="w-4 h-4" /> ${req.budget}</span>}
          </div>

          <div className={`prose prose-slate prose-p:leading-relaxed max-w-none ${req.related_tip ? 'mb-6' : 'mb-14'} bg-white border border-slate-200 rounded-2xl p-8 shadow-sm`}>
            <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          </div>

          {req.related_tip && (
            <p className="mb-14 text-slate-600 leading-relaxed">
              Related guide:{' '}
              <Link href={`/tips-and-tricks/${req.related_tip.slug}`} className="font-semibold text-primary hover:text-primary-dark">
                {req.related_tip.title}
              </Link>
            </p>
          )}

          {/* Quotes */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              Quotes / Offers
              <span className="ml-3 bg-slate-100 text-slate-600 text-xs py-1 px-3 rounded-full font-bold">
                {req.quotes?.length || 0}
              </span>
            </h2>

            {/* Quote Submission Form */}
            <div className="mb-10">
              {!token ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-slate-600 font-medium mb-4">Want to offer your expertise for this request?</p>
                  <Link href="/login" className="btn btn-primary inline-flex">Log in to Quote</Link>
                </div>
              ) : (
                <form className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" onSubmit={handleQuoteSubmit}>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Submit a Quote</h3>
                  {submitMessage.text && (
                    <div role={submitMessage.type === 'error' ? 'alert' : 'status'} className={`p-4 mb-4 text-sm rounded-lg ${submitMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                      {submitMessage.text}
                    </div>
                  )}
                  <div className="mb-4">
                    <label htmlFor="quote-price" className="block text-sm font-semibold text-slate-700 mb-1">Your Proposed Price ($)</label>
                    <input id="quote-price" type="number" min="0" max={MAX_AMOUNT} step="1" required className="input" placeholder="e.g. 150"
                      {...ariaFor('price', 'quote-price')}
                      value={quotePrice} onChange={e => { setQuotePrice(e.target.value); clearFieldError('price'); }} />
                    <FieldError id="quote-price-error" message={fieldErrors.price} />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="quote-message" className="block text-sm font-semibold text-slate-700 mb-1">Message / Proposal</label>
                    <textarea id="quote-message" required maxLength={10000} className="input min-h-[120px]" placeholder="Briefly describe how you can help..."
                      {...ariaFor('message', 'quote-message')}
                      value={quoteMessage} onChange={e => { setQuoteMessage(e.target.value); clearFieldError('message'); }}></textarea>
                    <FieldError id="quote-message-error" message={fieldErrors.message} />
                  </div>

                  <TurnstileWidget containerRef={turnstile.containerRef} error={turnstile.error} isEnabled={turnstile.isEnabled} />

                  <button type="submit" disabled={submitting} className="btn btn-primary w-full sm:w-auto mt-4">
                    {submitting ? 'Submitting...' : 'Submit Quote'}
                  </button>
                </form>
              )}
            </div>

            {(req.quotes || []).length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 font-medium">
                No quotes yet. Be the first to offer help!
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {req.quotes.map(q => (
                  <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-slate-800">{q.name}</span>
                      {q.price > 0 && <span className="text-emerald-600 font-black text-lg">${q.price}</span>}
                    </div>
                    <div className="text-slate-600 text-[15px] leading-relaxed mb-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: quoteHtml.get(q.id) ?? '' }} />
                    <div className="text-slate-400 text-xs font-semibold pt-4 border-t border-slate-100 mt-2">
                      {new Date(q.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
