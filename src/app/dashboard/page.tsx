'use client';

import { useAuth } from '@/context/AuthContext';
import { FileText, Plus, Bell, User } from 'lucide-react';
import Link from 'next/link';

function getProfileCompletion(user: any) {
  const profile = user?.client_profile;
  const fields = [
    user?.name,
    user?.email,
    profile?.first_name,
    profile?.last_name,
    profile?.email_contact,
    profile?.site_url,
    profile?.country,
    profile?.experience,
    profile?.skills,
    profile?.languages,
  ];
  const filled = fields.filter(f => f && String(f).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  
  const activeRequests = user?.submitted_requests?.filter((r: any) => r.status && r.status.toLowerCase() !== 'completed').length || 0;
  const completion = getProfileCompletion(user);
  
  return (
    <div className="animate-fadeIn">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Welcome back, {user?.client_profile?.first_name || user?.name || 'Client'}!
          </h1>
          <p className="text-slate-500 font-medium">Here's what's happening with your projects today.</p>
        </div>
        <Link href="/dashboard/requests/new" className="btn btn-primary shadow-lg shadow-green-600/20 flex gap-2 items-center">
          <Plus className="w-5 h-5" />
          <span>Post a Request</span>
        </Link>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Requests</h3>
          <p className="text-4xl font-black text-slate-900 tracking-tight">{activeRequests}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm opacity-60">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Unread Quotes</h3>
          <p className="text-4xl font-black text-slate-900 tracking-tight">0</p>
        </div>

        {/* Profile Completion Card */}
        <Link href="/dashboard/profile" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-primary/30 transition-colors group">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Profile Complete</h3>
          <div className="flex items-end gap-2">
            <p className={`text-4xl font-black tracking-tight ${completion === 100 ? 'text-primary' : 'text-amber-600'}`}>{completion}%</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
            <div 
              className={`h-2 rounded-full transition-all ${completion === 100 ? 'bg-primary' : 'bg-amber-500'}`} 
              style={{ width: `${completion}%` }}
            />
          </div>
          {completion < 100 && (
            <p className="text-xs font-semibold text-amber-600 mt-2 group-hover:underline">Complete your profile →</p>
          )}
        </Link>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-8 py-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <Link href="/dashboard/requests" className="text-sm font-bold text-primary hover:underline">View All</Link>
        </div>
        <div className="p-8 text-center bg-slate-50/50">
          <p className="text-slate-500 font-medium my-8">No recent activity on your requests.</p>
          <Link href="/dashboard/requests/new" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Post a new request
          </Link>
        </div>
      </div>
    </div>
  );
}
