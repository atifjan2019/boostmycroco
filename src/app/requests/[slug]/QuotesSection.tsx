'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import TurnstileWidget from '@/components/TurnstileWidget';
import FieldError from '@/components/FieldError';
import QuoteItem from '@/components/QuoteItem';
import { BROWSER_API_BASE } from '@/lib/browser-api';
import { focusFirstError, generalMessage, NETWORK_ERROR, readFailure } from '@/lib/form-errors';
import { createdQuote, type QuoteData } from '@/lib/public-api';
import { MAX_AMOUNT } from '@/lib/request-form';
import { ARCHIVED_NOTE } from '@/lib/request-status';

const QUOTE_FIELDS = ['price', 'message'];

/**
 * The quotes part of a request page: heading with the count, the quote form (or the archived note / log-in
 * prompt), then the quotes. The quotes that were on the page when it was built come in as `children` (rendered on
 * the server); a quote sent from this page is added after them straight from the API's answer.
 */
export default function QuotesSection({
  requestId,
  quoteCount,
  archived,
  children,
}: {
  requestId: number;
  quoteCount: number;
  archived: boolean;
  /** The server-rendered quote list (null when there are no quotes). */
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const [added, setAdded] = useState<QuoteData[]>([]);

  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const { fieldErrors, setFieldErrors, clearFieldError, ariaFor } = useFieldErrors();
  const turnstile = useTurnstile();

  const total = quoteCount + added.length;

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
          request_id: requestId,
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
        // Shown from the API's answer: the page itself is cached for a few minutes, so a reload could miss it.
        const quote = createdQuote(await res.json().catch(() => null));
        if (quote) {
          setAdded(list => [...list, quote]);
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
    <section aria-labelledby="quotes-heading" className="mt-14">
      <h2 id="quotes-heading" className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        Quotes / Offers
        <span className="ml-3 bg-slate-100 text-slate-600 text-xs py-1 px-3 rounded-full font-bold">{total}</span>
      </h2>

      <div className="mb-10">
        {archived ? (
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3 text-slate-600 font-medium">
            <Archive aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0 text-slate-400" />
            <p>{ARCHIVED_NOTE}</p>
          </div>
        ) : !token ? (
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

      {total === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 font-medium">
          {archived ? 'No quotes were sent for this request.' : 'No quotes yet. Be the first to offer help!'}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {children}
          {added.map((q, i) => <QuoteItem key={q.id ?? `new-${i}`} quote={q} />)}
        </div>
      )}
    </section>
  );
}
