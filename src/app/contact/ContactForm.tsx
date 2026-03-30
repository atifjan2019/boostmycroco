'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
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
          }}
          className="mt-6 text-primary font-bold hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <Send className="w-6 h-6 text-primary" /> Send a Message
      </h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="first_name" className="block text-sm font-bold text-slate-700">First Name</label>
            <input 
              type="text" 
              id="first_name" 
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-medium" 
              placeholder="John"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="last_name" className="block text-sm font-bold text-slate-700">Last Name</label>
            <input 
              type="text" 
              id="last_name" 
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-medium" 
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-bold text-slate-700">Email Address</label>
          <input 
            type="email" 
            id="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-medium" 
            placeholder="john@example.com"
            required
          />
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
            <option value="billing">Billing & Quotes</option>
            <option value="report">Report an Issue</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm font-bold text-slate-700">Message</label>
          <textarea 
            id="message" 
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-medium resize-none" 
            placeholder="How can we help you today?"
            required
          ></textarea>
        </div>

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
