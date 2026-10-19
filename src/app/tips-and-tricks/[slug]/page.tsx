import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommentSectionWrapper from '@/components/CommentSectionWrapper';
import JsonLd from '@/components/JsonLd';
import { BookOpen, Calendar, ChevronLeft, Code2, ExternalLink, HelpCircle, RefreshCw, User } from 'lucide-react';
import {
  getRelatedTips,
  getTip,
  isOrganizationAuthor,
  tipAuthor,
  tipCanonical,
  tipDescription,
  type Tip,
} from '@/lib/tips';
import { absoluteUrl, DEFAULT_OG_IMAGE, isSafeSlug, SITE_NAME, SITE_URL } from '@/lib/site';
import { parseCustomSchema, reconcileCustomSchema } from '@/lib/jsonld';
import { escapeAttribute, formatDate, isoDate } from '@/lib/text';

// Incremental static regeneration: each tip page is rebuilt at most once an hour.
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

/** Pre-builds every published tip; tips added later are built on their first visit. */
// Nothing is prerendered at build time: each tip renders on its first visit and is then cached (revalidate below),
// like requests and members. Prerendering every tip made each build fetch one API page per tip, and with a new tip
// every day that soon goes past the API's limit of 60 requests a minute per address, which fails the Vercel build.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

async function loadTip(slug: string): Promise<Tip> {
  if (!isSafeSlug(slug)) notFound();
  const tip = await getTip(slug);
  if (!tip) notFound();
  return tip;
}

// Player and app cards need extra fields a tip does not have, so only the two image cards are allowed.
const TWITTER_CARDS = ['summary', 'summary_large_image'] as const;
type TwitterCard = (typeof TWITTER_CARDS)[number];

function twitterCard(value: string | null): TwitterCard {
  return TWITTER_CARDS.find((card) => card === value) ?? 'summary_large_image';
}

function shareImage(tip: Tip) {
  const url = tip.og_image_url || tip.featured_image;
  return url ? { url, alt: tip.image_alt_text || tip.title } : DEFAULT_OG_IMAGE;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const tip = await loadTip(slug);

  const description = tipDescription(tip);
  const canonical = tipCanonical(tip);
  const image = shareImage(tip);
  const author = tipAuthor(tip);
  const ogTitle = tip.og_title || tip.meta_title || tip.title;

  return {
    // An editor-written SEO title is used exactly as written; otherwise "<title> | BoostMyCroco".
    title: tip.meta_title ? { absolute: tip.meta_title } : tip.title,
    description,
    alternates: { canonical },
    authors: [{ name: author }],
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: canonical,
      title: ogTitle,
      description: tip.og_description || description,
      images: [image],
      publishedTime: isoDate(tip.created_at),
      modifiedTime: isoDate(tip.updated_at) ?? isoDate(tip.created_at),
      authors: [author],
    },
    twitter: {
      card: twitterCard(tip.twitter_card_type),
      title: tip.twitter_title || ogTitle,
      description: tip.twitter_description || tip.og_description || description,
      images: [image.url],
    },
  };
}

/** Adds alt text (when missing) and lazy loading to images inside the tip's HTML. */
function enhanceImages(html: string, fallbackAlt: string): string {
  return html.replace(/<img\b([^>]*?)\s*\/?>/gi, (_match, attrs: string) => {
    let out = attrs;
    if (!/\salt\s*=/i.test(out)) out += ` alt="${escapeAttribute(fallbackAlt)}"`;
    if (!/\sloading\s*=/i.test(out)) out += ' loading="lazy"';
    if (!/\sdecoding\s*=/i.test(out)) out += ' decoding="async"';
    return `<img${out}>`;
  });
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** True when the tip was changed at least a day after it was published. */
function wasUpdated(tip: Tip): boolean {
  if (!tip.updated_at || !tip.created_at) return false;
  const published = new Date(tip.created_at).getTime();
  const updated = new Date(tip.updated_at).getTime();
  return Number.isFinite(published) && Number.isFinite(updated) && updated - published > 24 * 60 * 60 * 1000;
}

function buildStructuredData(tip: Tip, pageUrl: string, description: string): unknown[] {
  const author = tipAuthor(tip);
  // The image the page shows first; the share-only og_image_url and the site default only when it has none.
  const image = absoluteUrl(tip.featured_image || shareImage(tip).url);
  const published = isoDate(tip.created_at);
  const modified = isoDate(tip.updated_at) ?? published;

  // Facts every article node must state exactly as the page shows them (byline, dates, address).
  const facts = {
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: isOrganizationAuthor(author)
      ? { '@type': 'Organization', name: author, url: SITE_URL }
      : { '@type': 'Person', name: author },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    url: pageUrl,
  };
  const defaults = {
    headline: tip.title,
    description,
    image: [image],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/Favi.png') },
    },
  };

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    ...defaults,
    ...facts,
    ...(tip.sources.length > 0 ? { citation: tip.sources.map((source) => source.url) } : {}),
  };

  // Schema an editor wrote by hand is kept (invalid JSON is ignored), but its FAQ and breadcrumb parts are
  // replaced by the ones built from what the page shows, and its article facts are corrected.
  const custom = reconcileCustomSchema(parseCustomSchema(tip.schema_markup), facts, defaults, ['FAQPage', 'BreadcrumbList']);

  const faqPage =
    tip.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: tip.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }
      : null;

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Tips & Tricks', item: absoluteUrl('/tips-and-tricks') },
      { '@type': 'ListItem', position: 3, name: tip.title, item: pageUrl },
    ],
  };

  return [custom.hasArticle ? null : article, custom.schema, faqPage, breadcrumbs].filter(Boolean);
}

export default async function TipDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tip = await loadTip(slug);
  const { tips: related, fromApi: relatedFromApi } = await getRelatedTips(tip);

  const description = tipDescription(tip);
  const pageUrl = absoluteUrl(tipCanonical(tip));
  const author = tipAuthor(tip);
  const fallbackAlt = tip.image_alt_text || tip.title;
  const content = enhanceImages(tip.content, fallbackAlt);
  const textAfterCode = tip.text_after_code ? enhanceImages(tip.text_after_code, fallbackAlt) : '';

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      {buildStructuredData(tip, pageUrl, description).map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <Navbar />
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-8">
          <Link href="/tips-and-tricks" className="inline-flex items-center text-slate-500 text-sm font-semibold hover:text-primary transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" /> Back to Tips & Tricks
          </Link>

          <header className="mb-8 border-b border-slate-100 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight text-balance">
              {tip.title}
            </h1>
            <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-slate-500 font-medium text-sm">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Published on <time dateTime={isoDate(tip.created_at)}>{formatDate(tip.created_at)}</time>
                </span>
              </span>
              {wasUpdated(tip) && (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    Updated <time dateTime={isoDate(tip.updated_at)}>{formatDate(tip.updated_at)}</time>
                  </span>
                </span>
              )}
            </div>
          </header>

          {tip.featured_image && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-slate-100">
              <img src={tip.featured_image} alt={fallbackAlt} fetchPriority="high" decoding="async" className="w-full h-auto object-cover max-h-[500px]" />
            </div>
          )}

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary-dark prose-img:rounded-xl prose-img:shadow-md">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>

          {tip.code && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900">Code</h2>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <pre className="bg-[#1e1e2f] text-[#a6accd] p-6 overflow-x-auto text-sm leading-relaxed">
                  <code>{tip.code}</code>
                </pre>
              </div>
            </div>
          )}

          {textAfterCode && (
            <div className="mt-8 prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary-dark prose-img:rounded-xl prose-img:shadow-md">
              <div dangerouslySetInnerHTML={{ __html: textAfterCode }} />
            </div>
          )}

          {tip.faqs.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-4">
                {tip.faqs.map((faq, i) => (
                  <details key={i} className="group rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
                      {faq.question}
                      <ChevronLeft className="w-4 h-4 text-slate-400 -rotate-90 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-6 pb-5 pt-1 text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {tip.sources.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900">Sources</h2>
              </div>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 marker:text-slate-400">
                {tip.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="nofollow noopener noreferrer" className="font-semibold text-primary hover:text-primary-dark break-words">
                      {source.title}
                    </a>{' '}
                    <span className="text-slate-400">({hostname(source.url)})</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {related.length > 0 && (
            <section className="mt-14 pt-10 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900">{relatedFromApi ? 'Related tips' : 'Latest tips'}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link key={r.slug} href={`/tips-and-tricks/${r.slug}`} className="card overflow-hidden flex flex-col group">
                    {r.featured_image ? (
                      <div className="h-32 overflow-hidden border-b border-slate-100">
                        <img src={r.featured_image} alt={r.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-100 to-slate-50 h-32 flex items-center justify-center border-b border-slate-100">
                        <BookOpen className="w-10 h-10 text-slate-300 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-sm leading-snug text-slate-900 group-hover:text-primary transition-colors line-clamp-3">{r.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Comments Section */}
          <CommentSectionWrapper tipId={tip.id} tipSlug={tip.slug} />
        </article>
      </main>
      <Footer />
    </div>
  );
}
