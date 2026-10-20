import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import MemberCard from '@/components/MemberCard';
import Pagination, { listPath } from '@/components/Pagination';
import MemberSearch from './MemberSearch';
import { getMembersPage, plural } from '@/lib/community';
import { breadcrumbList } from '@/lib/jsonld';
import { pageMetadata, SITE_NAME, SITE_URL } from '@/lib/site';

// Server-rendered on each request (it reads ?page=), with the API answers cached for 5 minutes.
export const revalidate = 300;

const BASE_PATH = '/teamwork';

const INTRO =
  'These are the members of the BoostMyCroco community: people who post Crocoblock and WordPress jobs and the developers who take them on. Open a profile to see the requests a member has posted and the quotes they have sent.';

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
      title: { absolute: `TeamWork Members: Page ${page} | ${SITE_NAME}` },
      description: `Page ${page} of the BoostMyCroco TeamWork directory: Crocoblock and WordPress members with the requests they posted and the quotes they sent.`,
      path: listPath(BASE_PATH, page),
    });
  }
  return pageMetadata({
    title: 'TeamWork: Crocoblock Community Members',
    description:
      'Meet the BoostMyCroco community: Crocoblock and JetEngine developers and site builders, with the requests they posted and the quotes they gave.',
    path: BASE_PATH,
  });
}

export default async function TeamworkPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePage((await searchParams).page);
  if (page === null) notFound();

  const { items, total, lastPage } = await getMembersPage(page);
  if (page > 1 && (page > lastPage || items.length === 0)) notFound();

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'TeamWork', path: BASE_PATH },
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <JsonLd data={breadcrumbList(crumbs, SITE_URL)} />
      <Navbar />
      <main className="flex-1">
        <div className="py-12 border-b border-border bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <Breadcrumbs items={crumbs} className="mb-4" />
            <h1 className="text-4xl font-extrabold mb-3 text-slate-900 tracking-tight">TeamWork</h1>
            <p className="text-slate-600 leading-relaxed max-w-3xl mb-3">{INTRO}</p>
            <p className="text-slate-500 font-medium">
              {plural(total, 'community member')}
              {page > 1 && <span> · Page {page} of {lastPage}</span>}
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <MemberSearch>
            {items.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium">No members found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((m, i) => <MemberCard key={`${m.slug ?? "m"}-${i}`} member={m} />)}
              </div>
            )}
            <Pagination page={page} lastPage={lastPage} basePath={BASE_PATH} label="TeamWork pages" />
          </MemberSearch>
        </div>
      </main>
      <Footer />
    </div>
  );
}
