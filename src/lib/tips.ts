import { API_BASE, isSafeSlug } from '@/lib/site';
import { logUpstreamFailure } from '@/lib/upstream-error';
import { bodyText, plainText, truncate } from '@/lib/text';

/**
 * Server-side access to the public tips API.
 *
 * Coded against the documented API (`per_page`, `last_page`, `excerpt`, `related`, `sources`,
 * `/api/sitemap/tips`) and still working with the older API that has none of them: it pages by 10,
 * ignores `per_page`, sends full content in the list and has no sitemap endpoint.
 */

export const TIPS_PER_PAGE = 12;
/** Page size of the older API, which ignores `per_page`. */
const LEGACY_PAGE_SIZE = 10;
export const TIP_LIST_REVALIDATE = 600;
export const TIP_PAGE_REVALIDATE = 3600;

export const ORG_AUTHOR = 'BoostMyCroco Team';

export interface Faq {
  question: string;
  answer: string;
}

export interface TipSource {
  url: string;
  title: string;
}

export interface TipCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  image_alt_text: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string | null;
}

/** A page the tip links to by title and slug (the community request a tip answers). */
export interface PageLink {
  title: string;
  slug: string;
}

export interface RelatedTip {
  title: string;
  slug: string;
  featured_image: string | null;
  excerpt: string;
}

export interface Tip extends TipCard {
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  schema_markup: string | null;
  code: string | null;
  text_after_code: string | null;
  faqs: Faq[];
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card_type: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  canonical_url: string | null;
  sources: TipSource[];
  /** null when the API did not send `related` (older API). */
  related: RelatedTip[] | null;
  /** The community request this guide answers, when there is one (null with the older API). */
  source_request: PageLink | null;
}

export interface TipListPage {
  tips: TipCard[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

export interface TipSitemapEntry {
  slug: string;
  updated_at: string | null;
}

type Raw = Record<string, unknown>;

function isRaw(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function toInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function httpUrl(value: unknown): string | null {
  const s = str(value);
  if (!s) return null;
  try {
    const url = new URL(s);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Readable text of a tip: without its headings when that leaves a sentence or more, else all of it. */
function readableText(html: string): string {
  const body = bodyText(html);
  return body.length >= 50 ? body : plainText(html);
}

function excerptOf(raw: Raw): string {
  return str(raw.excerpt) ?? truncate(readableText(str(raw.content) ?? ''), 160);
}

function toCard(raw: Raw): TipCard {
  return {
    id: toInt(raw.id) ?? 0,
    title: str(raw.title) ?? 'Untitled tip',
    slug: str(raw.slug) ?? '',
    excerpt: excerptOf(raw),
    featured_image: httpUrl(raw.featured_image),
    image_alt_text: str(raw.image_alt_text),
    author_name: str(raw.author_name),
    created_at: str(raw.created_at) ?? '',
    updated_at: str(raw.updated_at),
  };
}

function toFaqs(value: unknown): Faq[] {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .filter(isRaw)
    .map((faq) => ({ question: str(faq.question) ?? '', answer: str(faq.answer) ?? '' }))
    .filter((faq) => faq.question !== '' && faq.answer !== '');
}

function toSources(value: unknown): TipSource[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const sources: TipSource[] = [];
  for (const item of value) {
    const url = isRaw(item) ? httpUrl(item.url) : httpUrl(item);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({ url, title: (isRaw(item) && str(item.title)) || new URL(url).hostname.replace(/^www\./, '') });
    if (sources.length === 12) break;
  }
  return sources;
}

function toRelated(value: unknown): RelatedTip[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter(isRaw)
    .map((raw) => ({
      title: str(raw.title) ?? '',
      slug: str(raw.slug) ?? '',
      featured_image: httpUrl(raw.featured_image),
      excerpt: excerptOf(raw),
    }))
    .filter((tip) => tip.title !== '' && tip.slug !== '')
    .slice(0, 3);
}

/** {title, slug} with a slug safe to put in a URL, else null. */
function toPageLink(value: unknown): PageLink | null {
  if (!isRaw(value)) return null;
  const title = str(value.title);
  const slug = str(value.slug);
  return title && slug && isSafeSlug(slug) ? { title, slug } : null;
}

function toTip(raw: Raw): Tip {
  return {
    ...toCard(raw),
    content: typeof raw.content === 'string' ? raw.content : '',
    meta_title: str(raw.meta_title),
    meta_description: str(raw.meta_description),
    schema_markup: str(raw.schema_markup),
    code: typeof raw.code === 'string' && raw.code.trim() !== '' ? raw.code : null,
    text_after_code: str(raw.text_after_code),
    faqs: toFaqs(raw.faqs),
    og_title: str(raw.og_title),
    og_description: str(raw.og_description),
    og_image_url: httpUrl(raw.og_image_url),
    twitter_card_type: str(raw.twitter_card_type),
    twitter_title: str(raw.twitter_title),
    twitter_description: str(raw.twitter_description),
    canonical_url: str(raw.canonical_url),
    sources: toSources(raw.sources),
    related: toRelated(raw.related),
    source_request: toPageLink(raw.source_request),
  };
}

function pageInfo(data: Raw, requestedPage: number, itemCount: number) {
  const total = toInt(data.total) ?? itemCount;
  const perPage = toInt(data.per_page) || LEGACY_PAGE_SIZE;
  const lastPage = toInt(data.last_page) || Math.max(1, Math.ceil(total / perPage));
  return { total, page: toInt(data.page) || requestedPage, perPage, lastPage };
}

/** One page of the published tips list. Throws when the API cannot be reached. */
export async function getTipsPage(page: number): Promise<TipListPage> {
  const url = `${API_BASE}/api/tips-and-tricks?page=${page}&per_page=${TIPS_PER_PAGE}`;
  const res = await fetch(url, {
    next: { revalidate: TIP_LIST_REVALIDATE },
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    await logUpstreamFailure('tips list', url, res);
    throw new Error(`The tips list could not be loaded (HTTP ${res.status}).`);
  }
  const data: unknown = await res.json();
  const body = isRaw(data) ? data : {};
  const tips = (Array.isArray(body.tips) ? body.tips : []).filter(isRaw).map(toCard).filter((tip) => tip.slug !== '');
  return { tips, ...pageInfo(body, page, tips.length) };
}

/**
 * One published tip, or null when the API says it does not exist (404).
 * Any other failure throws, so a cached page is kept instead of being replaced by a 404.
 */
export async function getTip(slug: string): Promise<Tip | null> {
  const url = `${API_BASE}/api/tips-and-tricks/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    next: { revalidate: TIP_PAGE_REVALIDATE },
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    await logUpstreamFailure(`tip ${slug}`, url, res);
    throw new Error(`The tip could not be loaded (HTTP ${res.status}).`);
  }
  const data: unknown = await res.json();
  if (!isRaw(data) || data.error || !str(data.slug)) return null;
  return toTip(data);
}

/**
 * Up to three tips to link from the bottom of a tip. Uses the API's `related` list; with the older
 * API (no `related`) it falls back to the latest tips.
 */
export async function getRelatedTips(tip: Tip): Promise<{ tips: RelatedTip[]; fromApi: boolean }> {
  if (tip.related !== null) return { tips: tip.related.filter((t) => t.slug !== tip.slug), fromApi: true };
  try {
    // per_page=4 keeps this a separate cache entry from the list page (which revalidates faster).
    const res = await fetch(`${API_BASE}/api/tips-and-tricks?page=1&per_page=4`, {
      next: { revalidate: TIP_PAGE_REVALIDATE },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { tips: [], fromApi: false };
    const data: unknown = await res.json();
    const list = isRaw(data) && Array.isArray(data.tips) ? data.tips.filter(isRaw).map(toCard) : [];
    const tips = list
      .filter((t) => t.slug !== '' && t.slug !== tip.slug)
      .slice(0, 3)
      .map((t) => ({ title: t.title, slug: t.slug, featured_image: t.featured_image, excerpt: t.excerpt }));
    return { tips, fromApi: false };
  } catch {
    return { tips: [], fromApi: false };
  }
}

function toSitemapEntry(value: unknown): TipSitemapEntry | null {
  if (!isRaw(value)) return null;
  const slug = str(value.slug);
  if (!slug) return null;
  return { slug, updated_at: str(value.updated_at) ?? str(value.created_at) };
}

function uniqueEntries(entries: (TipSitemapEntry | null)[]): TipSitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry): entry is TipSitemapEntry => {
    if (!entry || seen.has(entry.slug)) return false;
    seen.add(entry.slug);
    return true;
  });
}

/** Every published tip's slug and last change, for the sitemap and build-time page generation. */
export async function getTipSitemapEntries(): Promise<TipSitemapEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/sitemap/tips`, {
      next: { revalidate: TIP_PAGE_REVALIDATE },
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data: unknown = await res.json();
      if (Array.isArray(data)) return uniqueEntries(data.map(toSitemapEntry));
    }
  } catch {
    // Older API: no sitemap endpoint. Walk the paginated list below.
  }

  const entries: (TipSitemapEntry | null)[] = [];
  for (let page = 1, lastPage = 1; page <= lastPage && page <= 200; page++) {
    const res = await fetch(`${API_BASE}/api/tips-and-tricks?page=${page}&per_page=50`, {
      next: { revalidate: TIP_PAGE_REVALIDATE },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`The tips list could not be loaded (HTTP ${res.status}).`);
    const data: unknown = await res.json();
    const body = isRaw(data) ? data : {};
    const tips = Array.isArray(body.tips) ? body.tips : [];
    if (tips.length === 0) break;
    entries.push(...tips.map(toSitemapEntry));
    lastPage = pageInfo(body, page, tips.length).lastPage;
  }
  return uniqueEntries(entries);
}

export function tipAuthor(tip: Pick<Tip, 'author_name'>): string {
  return tip.author_name ?? ORG_AUTHOR;
}

export function isOrganizationAuthor(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n === ORG_AUTHOR.toLowerCase() || n === 'boostmycroco';
}

/**
 * Meta description: the tip's own, else the start of its text without headings, else the start of
 * all its text, else a short line from the title.
 */
export function tipDescription(tip: Tip): string {
  if (tip.meta_description) return tip.meta_description;
  const text = readableText([tip.content, tip.text_after_code].filter(Boolean).join(' '));
  if (text) return truncate(text, 155);
  return `${tip.title}: a tip from the BoostMyCroco community.`;
}

/**
 * Canonical for a tip: its own page unless an editor set canonical_url. A canonical on this site is
 * kept as a path (so it always resolves to the www host); one on another site is kept as is.
 */
export function tipCanonical(tip: Tip): string {
  const fallback = `/tips-and-tricks/${tip.slug}`;
  if (!tip.canonical_url) return fallback;
  try {
    const url = new URL(tip.canonical_url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
    const host = url.hostname.toLowerCase();
    if (host === 'boostmycroco.com' || host === 'www.boostmycroco.com') {
      const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
      return path + url.search;
    }
    return url.toString();
  } catch {
    return fallback;
  }
}
