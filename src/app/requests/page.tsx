import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import Pagination, { listPath } from '@/components/Pagination';
import RequestCard from '@/components/RequestCard';
import RequestFilters from './RequestFilters';
import { getRequestsPage, plural } from '@/lib/community';
import { breadcrumbList } from '@/lib/jsonld';
import { pageMetadata, SITE_NAME, SITE_URL } from '@/lib/site';

// Server-rendered on each request (it reads ?page=), with the API answers cached for 5 minutes.
export const revalidate = 300;

const BASE_PATH = '/requests';

const INTRO =
  'Members post Crocoblock, JetEngine, Elementor and WordPress jobs here, from a quick fix to a full build. Open a request to read the details and send a quote, or post your own and get offers from developers who know these plugins.';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Page number from ?page=. 1 when absent, null when it is not a positive whole number. */
function parsePage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!/^\d{1,5}$/.test(value)) return null;
  const page = parseInt(value, 10);
  return page >= 1 ? page : null;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  if (page === null) notFound();

  if (page > 1) {
    return pageMetadata({
      title: { absolute: `Requests: Page ${page} | ${SITE_NAME}` },
      description: `Page ${page} of the BoostMyCroco community requests: Crocoblock, JetEngine, Elementor and WordPress jobs looking for free help, quotes or offers.`,
      path: listPath(BASE_PATH, page),
    });
  }
  return pageMetadata({
    title: 'Crocoblock & JetEngine Help Requests',
    description:
      'Browse help requests from the Crocoblock community: JetEngine, JetSmartFilters, JetFormBuilder and Elementor projects looking for free help, quotes or offers.',
    path: BASE_PATH,
  });
}

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePage((await searchParams).page);
  if (page === null) notFound();

  const { items, total, lastPage } = await getRequestsPage(page);
  if (page > 1 && (page > lastPage || items.length === 0)) notFound();

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Requests', path: BASE_PATH },
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/30">
      <JsonLd data={breadcrumbList(crumbs, SITE_URL)} />
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <div className="py-12 border-b border-border bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <Breadcrumbs items={crumbs} className="mb-4" />
            <h1 className="text-4xl font-extrabold mb-3 text-slate-900 tracking-tight">Requests</h1>
            <p className="text-slate-600 leading-relaxed max-w-3xl mb-3">{INTRO}</p>
            <p className="text-slate-500 font-medium">
              {plural(total, 'request')} from the community
              {page > 1 && <span> · Page {page} of {lastPage}</span>}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          <RequestFilters>
            {items.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">No requests found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((r, i) => <RequestCard key={r.slug ?? r.id ?? i} request={r} />)}
              </div>
            )}
            <Pagination page={page} lastPage={lastPage} basePath={BASE_PATH} label="Requests pages" />
          </RequestFilters>
        </div>
      </main>
      <Footer />
    </div>
  );
}
