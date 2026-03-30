'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, User, LogOut, ArrowLeft } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Requests', href: '/dashboard/requests', icon: FileText },
    { name: 'Profile Settings', href: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              B
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">Client Hub</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          <Link href="/" className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Website
          </Link>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 md:p-12 w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
