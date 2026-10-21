import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { BookOpen, Calendar, CircleDollarSign, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import QuoteItem, { UNNAMED_BIDDER } from '@/components/QuoteItem';
import RequestCard from '@/components/RequestCard';
import { ArchivedBadge, StatusBadge, TypeBadge } from '@/components/RequestBadges';
import QuotesSection from './QuotesSection';
import { getRequestDetail } from '@/lib/community';
import { breadcrumbList } from '@/lib/jsonld';
import type { RequestDetailData } from '@/lib/public-api';
import { safeMemberHtml } from '@/lib/safe-html';
import { absoluteUrl, isSafeSlug, NOT_FOUND_METADATA, pageMetadata, SITE_URL } from '@/lib/site';
import { formatMoney, isoDate, plainText, shortDate, truncate } from '@/lib/text';

// Built on its first visit, then cached for 5 minutes (the backend also refreshes it at once through /api/revalidate
// when the request or one of its quotes changes). No loading.tsx: the 404 and the 308 to the canonical address must
// be decided before any HTML is sent.
export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

type Params = Promise<{ slug: string }>;

/** The address the request lives at: its slug, or its id for a request that has none. */
function canonicalSlug(request: RequestDetailData, requested: string): string {
  if (request.slug) return request.slug;
  return request.id !== null ? String(request.id) : requested;
}

const LANGUAGE_CODES: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  italian: 'it',
  portuguese: 'pt',
  arabic: 'ar',
  hindi: 'hi',
};

/** BCP 47 code for the request's language ("English" from the request form, or a code), else undefined. */
function langAttribute(language: string | null): string | undefined {
  if (!language) return undefined;
  const code = LANGUAGE_CODES[language.trim().toLowerCase()];
  if (code) return code;
  return /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(language.trim()) ? language.trim() : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NOT_FOUND_METADATA;
  const result = await getRequestDetail(slug);
  if (result.status === 'missing') return NOT_FOUND_METADATA;
  if (result.status === 'error') {
    // The page itself shows the error view (or the last good copy stays cached).
    return pageMetadata({
      title: 'Crocoblock Request',
      description: 'A help request from the BoostMyCroco Crocoblock community.',
      path: `/requests/${slug}`,
    });
  }

  const request = result.data;
  const path = `/requests/${canonicalSlug(request, slug)}`;
  const text = plainText(request.description);
  const kind = request.type ? `${request.type} request` : 'Request';
  const meta = pageMetadata({
    title: request.title,
    description: text ? truncate(text, 155) : `${kind} from the BoostMyCroco Crocoblock community: ${request.title}`,
    path,
  });

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      publishedTime: isoDate(request.created_at),
      modifiedTime: isoDate(request.last_activity_at),
    },
  };
}

function structuredData(request: RequestDetailData, pageUrl: string) {
  const authorUrl = request.author_slug ? absoluteUrl(`/teamwork/${request.author_slug}`) : undefined;
  const published = isoDate(request.created_at);
  const modified = isoDate(request.last_activity_at) ?? published;

  const posting = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: request.title,
    text: plainText(request.description) || request.title,
    url: pageUrl,
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: {
      '@type': 'Person',
      name: request.author_name ?? UNNAMED_BIDDER,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: request.quotes.length,
    },
    ...(request.quotes.length > 0
      ? {
          comment: request.quotes.map((q) => {
            const date = isoDate(q.created_at);
            return {
              '@type': 'Comment',
              text: plainText(q.message) || (q.price > 0 ? `Quote: ${formatMoney(q.price)}` : 'Quote'),
              ...(date ? { datePublished: date } : {}),
              author: { '@type': 'Person', name: q.name || UNNAMED_BIDDER },
            };
          }),
        }
      : {}),
  };

  return posting;
}

export default async function RequestDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) notFound();

  const result = await getRequestDetail(slug);
  if (result.status === 'missing') notFound();
  // Thrown so a cached copy of the page is kept (and the error view shown when there is none) instead of a 404.
  if (result.status === 'error') throw new Error('The request could not be loaded.');

  const request = result.data;
  const canonical = canonicalSlug(request, slug);
  // /requests/<id> and old or mistyped slugs that end in the right id: one permanent address per request.
  if (canonical !== slug && isSafeSlug(canonical)) permanentRedirect(`/requests/${canonical}`);

  const path = `/requests/${canonical}`;
  const pageUrl = absoluteUrl(path);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Requests', path: '/requests' },
    { name: request.title, path },
  ];
  const posted = shortDate(request.created_at);
  const descriptionHtml = safeMemberHtml(request.description);

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <JsonLd data={breadcrumbList(crumbs, SITE_URL)} />
      <JsonLd data={structuredData(request, pageUrl)} />
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Breadcrumbs items={crumbs} className="mb-8" />

          <article lang={langAttribute(request.language)}>
            <div className="flex gap-3 mb-6 flex-wrap">
              {/* An archived request shows only "Archived": its stored status would read as still open. */}
              {request.archived ? <ArchivedBadge /> : request.status !== null && <StatusBadge status={request.status} />}
              <TypeBadge type={request.type} />
              {request.language && (
                <span className="bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  {request.language}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight break-words">
              {request.title}
            </h1>

            <div className="flex gap-x-6 gap-y-3 text-slate-500 text-sm font-medium mb-10 flex-wrap pb-8 border-b border-slate-200">
              <span className="flex items-center gap-1.5 min-w-0">
                <User aria-hidden="true" className="w-4 h-4 shrink-0" />
                {request.author_name ? (
                  request.author_slug ? (
                    <Link href={`/teamwork/${request.author_slug}`} className="py-0.5 font-semibold text-slate-600 hover:text-primary transition-colors break-words">
                      {request.author_name}
                    </Link>
                  ) : (
                    <span className="break-words">{request.author_name}</span>
                  )
                ) : (
                  <span>{UNNAMED_BIDDER}</span>
                )}
              </span>
              {posted && (
                <span className="flex items-center gap-1.5">
                  <Calendar aria-hidden="true" className="w-4 h-4 shrink-0" />
                  <span>
                    Posted <time dateTime={isoDate(request.created_at)}>{posted}</time>
                  </span>
                </span>
              )}
              {request.budget > 0 && (
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CircleDollarSign aria-hidden="true" className="w-4 h-4 shrink-0" />
                  <span>
                    <span className="sr-only">Budget: </span>
                    {formatMoney(request.budget)}
                  </span>
                </span>
              )}
            </div>

            <div className={`prose prose-slate prose-p:leading-relaxed max-w-none ${request.related_tip ? 'mb-6' : ''} bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm member-html`}>
              {descriptionHtml ? (
                <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
              ) : (
                <p className="text-slate-500">No description was given.</p>
              )}
            </div>

            {request.related_tip && (
              <p className="text-slate-600 leading-relaxed">
                Related guide:{' '}
                <Link href={`/tips-and-tricks/${request.related_tip.slug}`} className="font-semibold text-primary hover:text-primary-dark">
                  {request.related_tip.title}
                </Link>
              </p>
            )}

            {request.id !== null && (
              <QuotesSection requestId={request.id} quoteCount={request.quotes.length} archived={request.archived}>
                {request.quotes.length > 0
                  ? request.quotes.map((q, i) => <QuoteItem key={q.id ?? `q-${i}`} quote={q} />)
                  : null}
              </QuotesSection>
            )}
          </article>

          {request.related_requests.length > 0 && (
            <section aria-labelledby="related-requests-heading" className="mt-16 pt-10 border-t border-slate-200">
              <h2 id="related-requests-heading" className="text-2xl font-bold text-slate-900 mb-6">Related requests</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {request.related_requests.map((r) => (
                  <RequestCard key={r.slug ?? r.id} request={r} heading="h3" showExcerpt={false} showAuthor={false} />
                ))}
              </div>
            </section>
          )}

          {request.related_tips.length > 0 && (
            <section aria-labelledby="related-tips-heading" className="mt-14">
              <h2 id="related-tips-heading" className="text-2xl font-bold text-slate-900 mb-6">Related tips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {request.related_tips.map((tip) => (
                  <div key={tip.slug} className="card p-5 relative flex items-start gap-3 min-w-0">
                    <BookOpen aria-hidden="true" className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                    <h3 className="font-bold text-sm leading-snug text-slate-900 line-clamp-3 break-words">
                      <Link
                        href={`/tips-and-tricks/${tip.slug}`}
                        className="outline-none hover:text-primary transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2"
                      >
                        {tip.title}
                      </Link>
                    </h3>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
