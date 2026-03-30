import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Home, ArrowLeft, SearchX } from 'lucide-react';

export const metadata = {
  title: 'Page Not Found | BoostMyCroco',
  description: 'The requested page could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-slate-50 isolate px-6 py-24">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,_rgba(22,163,74,0.08)_0%,_transparent_100%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(var(--color-border)_1px,_transparent_1px),_linear-gradient(90deg,_var(--color-border)_1px,_transparent_1px)] bg-[size:48px_48px] opacity-[0.15] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

        <div className="text-center animate-fadeIn max-w-2xl mx-auto">
          {/* Icon */}
          <div className="mb-8 relative inline-flex justify-center items-center">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="w-24 h-24 bg-white border border-border shadow-md rounded-3xl flex items-center justify-center relative z-10 animate-float">
              <SearchX className="w-12 h-12 text-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* 404 Text */}
          <h1 className="text-8xl md:text-[120px] font-black leading-none mb-6 tracking-tighter">
            <span className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">40</span>
            <span className="bg-gradient-to-br from-green-500 to-sky-500 bg-clip-text text-transparent">4</span>
          </h1>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Oops! Page not found
          </h2>
          
          <p className="text-lg text-slate-600 font-medium mb-10 leading-relaxed max-w-lg mx-auto">
            We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/" 
              className="btn btn-primary px-8 py-3.5 shadow-md shadow-green-600/20 flex items-center gap-2 group w-full sm:w-auto text-base"
            >
              <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
              Back to Home
            </Link>
            
            <Link 
              href="/requests"
              className="btn btn-outline border-slate-300 hover:bg-slate-100 flex items-center gap-2 group w-full sm:w-auto text-base"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Browse Requests
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
