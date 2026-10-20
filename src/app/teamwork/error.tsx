'use client'; // Error boundaries must be Client Components

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { RefreshCw } from 'lucide-react';

/** Shown when the members API cannot be reached and there is no cached copy of the page. */
export default function TeamworkError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <title>Members could not be loaded | BoostMyCroco</title>
      <meta name="robots" content="noindex" />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-32">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">The members could not be loaded</h1>
          <p className="text-slate-600 font-medium mb-8">This is usually temporary. Please try again in a minute.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button type="button" onClick={() => unstable_retry()} className="btn btn-primary">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <Link href="/" className="btn btn-outline bg-white">Back to Home</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
