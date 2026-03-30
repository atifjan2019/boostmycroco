'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FileText, MessageSquareQuote, ChevronRight, Plus } from 'lucide-react';

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'quotes'>('requests');

  const myRequests = user?.submitted_requests || [];
  const myQuotes = user?.quotes || []; 

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {activeTab === 'requests' ? 'My Requests' : 'My Quotes'}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('requests')} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Requests
            </button>
            <button 
              onClick={() => setActiveTab('quotes')} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'quotes' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Quotes
            </button>
          </div>
          {activeTab === 'requests' && (
            <Link href="/dashboard/requests/new" className="btn btn-primary shadow-md shadow-green-600/20 py-2.5 px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Request
            </Link>
          )}
        </div>
      </div>

      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {myRequests.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Requests Found</h3>
              <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto mb-6">You haven't posted any project requests on the marketplace yet.</p>
              <Link href="/dashboard/requests/new" className="btn btn-primary inline-flex">Post your first request</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRequests.map((r: any) => (
                <div key={r.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                  <div>
                    <Link href={`/requests/${r.id}`} className="font-bold text-slate-900 text-lg hover:text-primary transition-colors block mb-1">
                      {r.title}
                    </Link>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><MessageSquareQuote className="w-3.5 h-3.5" /> Budget: ${r.budget}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge badge-${(r.status || 'initied').toLowerCase()}`}>{r.status || 'Initied'}</span>
                    <Link href={`/requests/${r.id}`} className="text-slate-400 group-hover:text-primary p-2 rounded-full hover:bg-green-50 transition-colors hidden md:block">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {myQuotes.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquareQuote className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Quotes Found</h3>
              <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto mb-6">You haven't submitted any quotes for existing requests yet.</p>
              <Link href="/requests" className="btn btn-outline inline-flex">Browse Open Requests</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myQuotes.map((q: any) => (
                <div key={q.id} className="p-6">
                  {/* Quote listing UI */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
