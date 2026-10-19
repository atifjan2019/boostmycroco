'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Globe, BookOpen, Users, FileText, LogIn, UserPlus, Briefcase, Mail, Shield, Scale } from 'lucide-react';

interface Tip { id: number; title: string; slug: string; created_at: string; }

const staticLinks = [
  { label: 'Home', href: '/', icon: Globe },
  { label: 'Requests', href: '/requests', icon: FileText },
  { label: 'Make a Request', href: '/make-a-request', icon: Briefcase },
  { label: 'TeamWork', href: '/teamwork', icon: Users },
  { label: 'Tips & Tricks', href: '/tips-and-tricks', icon: BookOpen },
  { label: 'Login', href: '/login', icon: LogIn },
  { label: 'Register', href: '/register', icon: UserPlus },
  { label: 'Contact Us', href: '/contact', icon: Mail },
  { label: 'Privacy Policy', href: '/privacy-policy', icon: Shield },
  { label: 'Terms & Conditions', href: '/terms-and-conditions', icon: Scale },
];

export default function SitemapPage() {
  const [tips, setTips] = useState<Tip[]>([]);

  useEffect(() => {
    async function loadAllTips() {
      const all: Tip[] = [];
      // Stop at last_page when the API sends it, otherwise when every tip is loaded or a page comes back empty
      // (the API's page size is not fixed, so it is never assumed).
      for (let page = 1; page <= 100; page++) {
        const res = await fetch(`/api/tips-and-tricks?page=${page}&per_page=50`);
        if (!res.ok) break;
        const data = await res.json();
        const batch: Tip[] = data.tips || [];
        if (batch.length === 0) break;
        all.push(...batch);
        const lastPage = Number(data.last_page) || 0;
        if (lastPage ? page >= lastPage : all.length >= (Number(data.total) || 0)) break;
      }
      setTips(all);
    }
    loadAllTips();
  }, []);

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <Navbar />
      <main className="flex-1">
        <div className="py-12 border-b border-border bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-extrabold mb-2 text-slate-900 tracking-tight">Sitemap</h1>
            <p className="text-slate-500 font-medium">A complete list of all pages on BoostMyCroco</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200">Main Pages</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {staticLinks.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 hover:border-primary/30 hover:shadow-sm transition-all group">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {tips.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200">
                Tips & Tricks Posts <span className="text-sm font-normal text-slate-400 ml-2">({tips.length} posts)</span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tips.map((tip) => (
                  <li key={tip.id}>
                    <Link href={`/tips-and-tricks/${tip.slug}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 hover:border-primary/30 hover:shadow-sm transition-all group">
                      <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors line-clamp-1">{tip.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
