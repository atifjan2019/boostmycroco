'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function NewRequestPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Free',
    language: '',
    budget: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://admin.boostmycroco.com';
      const res = await fetch(`${apiUrl}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          budget: parseFloat(form.budget) || 0,
          author_name: user?.name || 'Unknown',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/dashboard/requests');
      } else {
        setErrorMsg(data.message || 'Failed to create request.');
      }
    } catch {
      setErrorMsg('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Post a New Request</h1>
        <p className="text-slate-500 font-medium">Describe your project so developers can send you quotes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col gap-6">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">{errorMsg}</div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Request Title</label>
          <input name="title" required className="input" placeholder="e.g. Need help with JetEngine listing grid"
            value={form.title} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Description</label>
          <textarea name="description" rows={5} className="input resize-none" placeholder="Describe what you need in detail..."
            value={form.description} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Type</label>
            <select name="type" className="input" value={form.type} onChange={handleChange}>
              <option value="Free">Free</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Language</label>
            <input name="language" className="input" placeholder="e.g. English" value={form.language} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Budget ($)</label>
            <input name="budget" type="number" min="0" step="0.01" className="input" value={form.budget} onChange={handleChange} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={() => router.back()} className="btn btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary shadow-md shadow-green-600/20 px-8 disabled:opacity-70">
            {loading ? 'Submitting...' : 'Publish Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
