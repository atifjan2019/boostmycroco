'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { href: '/requests', label: 'Requests' },
  { href: '/teamwork', label: 'TeamWork' },
  { href: '/tips-and-tricks', label: 'Tips & Tricks' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center h-16 gap-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* As requested, light theme means colorful logo */}
          <Image src="/colorlogo.png" alt="BoostMyCroco" width={160} height={40} className="object-contain h-9 w-auto" priority />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-1 flex-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith(l.href) ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text'
            }`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions Desktop */}
        <div className="hidden md:flex gap-3 items-center ml-auto">
          <Link href="/make-a-request" className="btn btn-primary">+ Make a Request</Link>
          {!loading && user ? (
            <Link href="/dashboard" className="btn btn-outline border-slate-300 hover:bg-slate-100 flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xs">
                {user?.client_profile?.first_name?.[0] || user?.name?.[0] || 'C'}
              </div>
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn btn-outline">Login</Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex ml-auto p-1.5 border border-border rounded-md text-text cursor-pointer hover:bg-bg-card focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-border px-6 py-4 flex flex-col gap-3 shadow-lg">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className={`font-medium ${pathname.startsWith(l.href) ? 'text-primary' : 'text-text-muted'}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/make-a-request" className="btn btn-primary mt-2 flex justify-center">+ Make a Request</Link>
          {!loading && user ? (
            <Link href="/dashboard" className="btn btn-outline flex justify-center bg-slate-50 border-slate-200">Dashboard</Link>
          ) : (
            <Link href="/login" className="btn btn-outline flex justify-center">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
