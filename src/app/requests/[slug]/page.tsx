'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { User, Calendar, CircleDollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

interface Quote { id: number; name: string; email: string; price: number; message: string; created_at: string; }
interface Request {
  id: number; title: string; description: string; status: string; type: string;
  language: string; author_name: string; created_at: string; budget: number;
  assigned_to: string; quotes: Quote[];
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

  useEffect(() => {
    if (slug) fetch(`/api/requests/${slug}`).then(r => r.json()).then(d => { setReq(d); setLoading(false); });
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

          <div className="prose prose-slate prose-p:leading-relaxed max-w-none mb-14 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div dangerouslySetInnerHTML={{ __html: req.description || '' }} />
          </div>

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
                <form className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  setSubmitMessage({ type: '', text: '' });
                  try {
                    const res = await fetch(`/api/quotes`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        request_id: req.id,
                        price: parseFloat(quotePrice) || 0,
                        message: quoteMessage
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setSubmitMessage({ type: 'success', text: 'Quote submitted successfully!' });
                      setQuotePrice('');
                      setQuoteMessage('');
                      // simple reload to see the new quote
                      setTimeout(() => window.location.reload(), 1500);
                    } else {
                      setSubmitMessage({ type: 'error', text: data.message || 'Failed to submit quote.' });
                    }
                  } catch (err) {
                    setSubmitMessage({ type: 'error', text: 'An unexpected error occurred.' });
                  }
                  setSubmitting(false);
                }}>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Submit a Quote</h3>
                  {submitMessage.text && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${submitMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                      {submitMessage.text}
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Your Proposed Price ($)</label>
                    <input type="number" min="0" step="1" required className="input" placeholder="e.g. 150" value={quotePrice} onChange={e => setQuotePrice(e.target.value)} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Message / Proposal</label>
                    <textarea required className="input min-h-[120px]" placeholder="Briefly describe how you can help..." value={quoteMessage} onChange={e => setQuoteMessage(e.target.value)}></textarea>
                  </div>
                  <button type="submit" disabled={submitting} className="btn btn-primary w-full sm:w-auto">
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
                      dangerouslySetInnerHTML={{ __html: q.message || '' }} />
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
