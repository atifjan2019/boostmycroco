import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { MemberAvatar } from '@/components/MemberCard';
import { ArchivedBadge, TypeBadge } from '@/components/RequestBadges';
import { getMemberProfile, plural } from '@/lib/community';
import { breadcrumbList } from '@/lib/jsonld';
import { requestPath, type MemberProfileData } from '@/lib/public-api';
import { absoluteUrl, isSafeSlug, NOT_FOUND_METADATA, pageMetadata, SITE_URL } from '@/lib/site';
import { formatMoney, isoDate, shortDate, truncate } from '@/lib/text';

// Built on its first visit, then cached for 5 minutes (the backend also refreshes it through /api/revalidate when
// the member posts a request or a quote). No loading.tsx: the 404 and the 308 must be decided before any HTML.
export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

type Params = Promise<{ slug: string }>;

/** No requests and no quotes: kept out of search results (noindex, follow), as the profile has nothing to show. */
function isEmptyProfile(m: MemberProfileData): boolean {
  return m.request_count === 0 && m.quote_count === 0;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSafeSlug(slug)) return NOT_FOUND_METADATA;
  const result = await getMemberProfile(slug);
  if (result.status === 'missing') return NOT_FOUND_METADATA;
  if (result.status === 'error') {
    return pageMetadata({
      title: 'Community Member',
      description: 'A member of the BoostMyCroco Crocoblock community.',
      path: `/teamwork/${slug}`,
    });
  }

  const member = result.data;
  const summary = `${member.name} is a member of the BoostMyCroco Crocoblock community: ${plural(member.request_count, 'request')} posted and ${plural(member.quote_count, 'quote')} given.`;
  return pageMetadata({
    title: `${member.name} – Community Member`,
    description: truncate(member.skills ? `${summary} Skills: ${member.skills}` : summary, 155),
    path: `/teamwork/${member.slug ?? slug}`,
    images: member.avatar ? [{ url: member.avatar, alt: member.name }] : undefined,
    noindex: isEmptyProfile(member),
  });
}

function profileSchema(member: MemberProfileData, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl,
    mainEntity: {
      '@type': 'Person',
      name: member.name,
      url: pageUrl,
      ...(member.avatar ? { image: member.avatar } : {}),
      // The member's own posts: Google's ProfilePage docs put WriteAction under agentInteractionStatistic.
      agentInteractionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/WriteAction',
        userInteractionCount: member.request_count,
      },
    },
  };
}

export default async function MemberProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!isSafeSlug(slug)) notFound();

  const result = await getMemberProfile(slug);
  if (result.status === 'missing') notFound();
  // Thrown so a cached copy of the page is kept (and the error view shown when there is none) instead of a 404.
  if (result.status === 'error') throw new Error('The member could not be loaded.');

  const member = result.data;
  // The API also matches member ids and loose or old name slugs: one permanent address per member.
  if (member.slug && member.slug !== slug) permanentRedirect(`/teamwork/${member.slug}`);

  const path = `/teamwork/${member.slug ?? slug}`;
  const pageUrl = absoluteUrl(path);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'TeamWork', path: '/teamwork' },
    { name: member.name, path },
  ];
  const since = shortDate(member.member_since);

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-50/50">
      <JsonLd data={breadcrumbList(crumbs, SITE_URL)} />
      <JsonLd data={profileSchema(member, pageUrl)} />
      <Navbar />
      <main className="flex-1">
        {/* Profile header */}
        <div className="bg-white border-b border-border shadow-sm py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <Breadcrumbs items={crumbs} className="mb-8" />
            <div className="flex items-start gap-6 md:gap-8 flex-wrap">
              <MemberAvatar name={member.name} avatar={member.avatar} size={96} />
              <div className="flex-1 min-w-0 pt-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 break-words">{member.name}</h1>
                {since && (
                  <div className="text-slate-500 font-medium text-sm mb-6 flex items-center gap-2">
                    <Calendar aria-hidden="true" className="w-4 h-4 shrink-0" />
                    <span>
                      Member since <time dateTime={isoDate(member.member_since)}>{since}</time>
                    </span>
                  </div>
                )}
                <div className="flex gap-8">
                  {[
                    { label: 'Requests Posted', value: member.request_count },
                    { label: 'Quotes Given', value: member.quote_count },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="font-black text-3xl text-primary mb-1">{s.value.toLocaleString('en-GB')}</div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Requests */}
          <section aria-labelledby="member-requests-heading" className="min-w-0">
            <h2 id="member-requests-heading" className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <svg aria-hidden="true" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Recent Requests
            </h2>
            {member.requests.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">No requests yet.</p>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {member.requests.map((r, i) => {
                    const href = requestPath(r);
                    const posted = shortDate(r.created_at);
                    return (
                      <article key={r.slug ?? r.id ?? i} className="card p-5 relative min-w-0">
                        <div className="flex justify-between items-center gap-3 mb-3">
                          <div className="flex flex-wrap gap-2">
                            <TypeBadge type={r.type} />
                            {r.archived && <ArchivedBadge />}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 shrink-0">
                            {r.budget > 0 && <span className="text-emerald-600 font-bold">{formatMoney(r.budget)}</span>}
                            {posted && <time dateTime={isoDate(r.created_at)}>{posted}</time>}
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-800 text-[15px] leading-snug break-words">
                          {href ? (
                            <Link
                              href={href}
                              className="outline-none hover:text-primary transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2"
                            >
                              {r.title}
                            </Link>
                          ) : (
                            r.title
                          )}
                        </h3>
                      </article>
                    );
                  })}
                </div>
                {member.request_count > member.requests.length && (
                  <p className="mt-4 text-sm text-slate-500 font-medium">
                    Showing the {member.requests.length} newest of {member.request_count.toLocaleString('en-GB')} requests.
                  </p>
                )}
              </>
            )}
          </section>

          {/* Quotes */}
          <section aria-labelledby="member-quotes-heading" className="min-w-0">
            <h2 id="member-quotes-heading" className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <svg aria-hidden="true" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Recent Quotes
            </h2>
            {member.quotes.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">No quotes yet.</p>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {member.quotes.map((q, i) => {
                    const posted = shortDate(q.created_at);
                    const title = q.request_title ?? 'A request that is no longer listed';
                    return (
                      <article key={i} className={`card p-5 min-w-0 ${q.request_slug ? 'relative' : ''}`}>
                        <div className="flex justify-between items-start mb-3 gap-3">
                          <h3 className="font-bold text-slate-800 text-[15px] leading-snug break-words min-w-0">
                            {q.request_slug ? (
                              <Link
                                href={`/requests/${q.request_slug}`}
                                className="outline-none hover:text-primary transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2"
                              >
                                {title}
                              </Link>
                            ) : (
                              title
                            )}
                          </h3>
                          {q.price > 0 && <span className="text-emerald-600 font-black text-sm shrink-0">{formatMoney(q.price)}</span>}
                        </div>
                        {posted && (
                          <div className="text-slate-400 text-xs font-semibold">
                            <time dateTime={isoDate(q.created_at)}>{posted}</time>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                {member.quote_count > member.quotes.length && (
                  <p className="mt-4 text-sm text-slate-500 font-medium">
                    Showing the {member.quotes.length} newest of {member.quote_count.toLocaleString('en-GB')} quotes.
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          <Link href="/teamwork" className="inline-flex items-center py-1 text-slate-500 text-sm font-semibold hover:text-primary transition-colors">
            ← Back to TeamWork
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
