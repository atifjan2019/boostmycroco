import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { BookOpen, Calendar } from 'lucide-react';
import { getTipsPage } from '@/lib/tips';
import { absoluteUrl, pageMetadata, SITE_URL } from '@/lib/site';
import { formatDate, isoDate } from '@/lib/text';

// Server-rendered on each request (it reads ?page=), with the API data cached for 10 minutes.
export const revalidate = 600;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Page number from ?page=. 1 when absent, null when it is not a positive whole number. */
function parsePage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!/^\d{1,5}$/.test(value)) return null;
  const page = parseInt(value, 10);
  return page >= 1 ? page : null;
}

function listPath(page: number): string {
  return page <= 1 ? '/tips-and-tricks' : `/tips-and-tricks?page=${page}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  if (page === null) notFound();

  if (page > 1) {
    return pageMetadata({
      title: `Tips & Tricks – Page ${page}`,
      description: `Page ${page} of the BoostMyCroco tips: practical guides and code snippets for Crocoblock, JetEngine, JetFormBuilder, Elementor and WordPress.`,
      path: listPath(page),
    });
  }
  return pageMetadata({
    title: 'Tips & Tricks: Crocoblock, WordPress & Web Dev Guides',
    description:
      'Practical guides and code snippets for Crocoblock, JetEngine, JetFormBuilder, Elementor, WordPress and web development from the BoostMyCroco community.',
    path: listPath(1),
  });
}

export default async function TipsAndTricksPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePage((await searchParams).page);
  if (page === null) notFound();

  const { tips, total, lastPage } = await getTipsPage(page);
  if (page > 1 && (page > lastPage || tips.length === 0)) notFound();

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tips & Tricks', item: absoluteUrl('/tips-and-tricks') },
    ],
  };

  const pagerClass = 'btn btn-outline bg-white hover:bg-slate-50';
  const pagerDisabledClass = 'btn btn-outline bg-white opacity-50 cursor-not-allowed';

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <JsonLd data={breadcrumbs} />
      <Navbar />
      <main className="flex-1">
        <div className="py-12 border-b border-border bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-extrabold mb-2 text-slate-900 tracking-tight">Tips & Tricks</h1>
            <p className="text-slate-500 font-medium">
              {total.toLocaleString('en-GB')} community guides and tutorials
              {page > 1 && <span> · Page {page} of {lastPage}</span>}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {tips.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">No posts found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tips.map((t, index) => (
                <Link key={t.id || t.slug} href={`/tips-and-tricks/${t.slug}`} className="card overflow-hidden flex flex-col group block">
                  {t.featured_image ? (
                    <div className="h-48 overflow-hidden border-b border-slate-100">
                      <img
                        src={t.featured_image}
                        alt={t.image_alt_text || t.title}
                        loading={index < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-slate-100 to-slate-50 h-48 flex items-center justify-center p-6 border-b border-slate-100">
                      <BookOpen className="w-16 h-16 text-slate-300 group-hover:text-primary transition-colors duration-300 transform group-hover:scale-110" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="font-bold text-xl leading-snug mb-3 text-slate-900 group-hover:text-primary transition-colors line-clamp-2">{t.title}</h2>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">{t.excerpt}</p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-auto pt-4 border-t border-slate-100">
                      <Calendar className="w-3.5 h-3.5" />
                      <time dateTime={isoDate(t.created_at)}>{formatDate(t.created_at, 'short')}</time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <nav aria-label="Tips pages" className="flex justify-center items-center gap-3 mt-14">
              {page > 1 ? (
                <Link href={listPath(page - 1)} rel="prev" className={pagerClass}>← Prev</Link>
              ) : (
                <span aria-disabled="true" className={pagerDisabledClass}>← Prev</span>
              )}
              <span className="px-4 font-semibold text-slate-600 text-sm">{page} / {lastPage}</span>
              {page < lastPage ? (
                <Link href={listPath(page + 1)} rel="next" className={pagerClass}>Next →</Link>
              ) : (
                <span aria-disabled="true" className={pagerDisabledClass}>Next →</span>
              )}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
