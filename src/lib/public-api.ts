/**
 * What the site takes from the Laravel API: only the fields the pages render, in one shape per kind of record.
 * Anything else the backend sends (email addresses, internal columns) is dropped here, so it never reaches a browser
 * (anything a server component passes to a client component is written into the page's HTML) even if the backend
 * starts returning it again.
 *
 * Coded against the API contract of 20 Oct 2026 (author_slug, archived, last_activity_at, related_requests,
 * related_tips, member name / avatar / member_since, last_page) and still working with the older API without them:
 * a missing author_slug means a plain author name, missing related lists mean no related blocks, a missing
 * archived flag means "not archived", and the old member fields (display_name, profile_image_url,
 * user_registered) are read when the new ones are absent.
 */

import { isSafeSlug } from '@/lib/site';
import { plainText, truncate } from '@/lib/text';

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Trimmed text, or null when missing or empty. */
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
/** HTML as sent (not trimmed), or null. */
const html = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : []);

/** A whole number of at least 0 (counts, ids), from a number or a numeric string; else null. */
function whole(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,12}$/.test(v.trim()) ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : null;
}

const count = (v: unknown): number => whole(v) ?? 0;

/** Prices and budgets arrive as decimal strings ("150.00"). 0 when missing or not a number. */
function amount(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/** A date the browser and the server both understand, as the API sent it; null when it is not a date. */
function date(v: unknown): string | null {
  const s = text(v);
  return s && !Number.isNaN(new Date(s).getTime()) ? s : null;
}

const slug = (v: unknown): string | null => {
  const s = text(v);
  return s && isSafeSlug(s) ? s : null;
};

/** An absolute http(s) address for an image (a member's avatar), else null. */
function imageUrl(v: unknown): string | null {
  const s = text(v);
  if (!s) return null;
  try {
    const url = new URL(s);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function newest(...values: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestTime = -Infinity;
  for (const value of values) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isFinite(time) && time > bestTime) {
      best = value;
      bestTime = time;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ requests */

/** One request in a list (the /requests page, the home page, a member's profile, "related requests"). */
export interface RequestCardData {
  id: number | null;
  slug: string | null;
  title: string;
  /** The start of the description as plain text ('' when the list did not send one). */
  excerpt: string;
  /** The stored status (show it with statusLabel), or null when the API did not send one. */
  status: string | null;
  type: string | null;
  budget: number;
  author_name: string | null;
  author_slug: string | null;
  created_at: string | null;
  archived: boolean;
}

export interface QuoteData {
  id: number | null;
  name: string;
  price: number;
  /** Member HTML: show it through safeMemberHtml. */
  message: string;
  created_at: string | null;
}

export interface PageLink {
  title: string;
  slug: string;
}

export interface RequestDetailData extends RequestCardData {
  /** Member HTML: show it through safeMemberHtml. */
  description: string;
  language: string | null;
  updated_at: string | null;
  /** Newest of created, updated and the newest quote (the API's last_activity_at when it sends one). */
  last_activity_at: string | null;
  quotes: QuoteData[];
  related_tip: PageLink | null;
  related_requests: RequestCardData[];
  related_tips: PageLink[];
}

/** The address of a request page: its slug, else its id (which redirects to the slug), else null (no link). */
export function requestPath(r: Pick<RequestCardData, 'slug' | 'id'>): string | null {
  if (r.slug) return `/requests/${r.slug}`;
  return r.id !== null ? `/requests/${r.id}` : null;
}

export function toRequestCard(r: Obj): RequestCardData {
  const description = html(r.description);
  return {
    id: whole(r.id),
    slug: slug(r.slug),
    title: text(r.title) ?? 'Untitled request',
    excerpt: description ? truncate(plainText(description), 180) : '',
    status: text(r.status),
    type: text(r.type),
    budget: amount(r.budget),
    author_name: text(r.author_name),
    author_slug: slug(r.author_slug),
    created_at: date(r.created_at),
    archived: r.archived === true,
  };
}

function toQuote(q: Obj): QuoteData {
  return {
    id: whole(q.id),
    name: text(q.name) ?? '',
    price: amount(q.price),
    message: html(q.message) ?? '',
    created_at: date(q.created_at),
  };
}

/** The quote in a 201 answer from POST /api/quotes ({message, quote}), or null. */
export function createdQuote(data: unknown): QuoteData | null {
  const q = isObj(data) ? data.quote : null;
  if (!isObj(q) || whole(q.id) === null) return null;
  return { ...toQuote(q), created_at: date(q.created_at) ?? new Date().toISOString() };
}

/** {title, slug} of a linked page, only with a slug that is safe in a URL. */
function pageLink(v: unknown): PageLink | null {
  if (!isObj(v)) return null;
  const title = text(v.title);
  const s = slug(v.slug);
  return title && s ? { title, slug: s } : null;
}

export function toRequestDetail(r: Obj): RequestDetailData {
  const card = toRequestCard(r);
  const quotes = list(r.quotes).map(toQuote);
  const updated = date(r.updated_at);
  const related = list(r.related_requests)
    .map(toRequestCard)
    .filter((x) => x.slug !== null && x.slug !== card.slug && (card.id === null || x.id !== card.id))
    .slice(0, 6);
  const relatedTips = list(r.related_tips)
    .map(pageLink)
    .filter((x): x is PageLink => x !== null)
    .slice(0, 3);

  return {
    ...card,
    description: html(r.description) ?? '',
    language: text(r.language),
    updated_at: updated,
    last_activity_at:
      date(r.last_activity_at) ?? newest(card.created_at, updated, ...quotes.map((q) => q.created_at)),
    quotes,
    related_tip: pageLink(r.related_tip),
    related_requests: related,
    related_tips: relatedTips,
  };
}

export interface ListPage<T> {
  items: T[];
  total: number;
  page: number;
  lastPage: number;
}

/** total / page / last page of a list answer; last_page is computed from the total when the API does not send it. */
function pageInfo(d: Obj, requestedPage: number, perPage: number, itemCount: number) {
  const total = whole(d.total) ?? itemCount;
  const lastPage = whole(d.last_page) || Math.max(1, Math.ceil(total / perPage));
  return { total, page: whole(d.current_page) || whole(d.page) || requestedPage, lastPage };
}

/** One page of GET /api/requests. */
export function toRequestList(data: unknown, requestedPage: number, perPage: number): ListPage<RequestCardData> {
  const d = isObj(data) ? data : {};
  const items = list(d.requests ?? d.data).map(toRequestCard);
  return { items, ...pageInfo(d, requestedPage, perPage, items.length) };
}

/* ------------------------------------------------------------------- members */

export interface MemberCardData {
  name: string;
  slug: string | null;
  avatar: string | null;
  /** The member's WordPress sign-up date when the API sends member_since, else the profile's creation date. */
  member_since: string | null;
  request_count: number;
  quote_count: number;
}

export interface MemberRequestData {
  id: number | null;
  title: string;
  slug: string | null;
  type: string | null;
  budget: number;
  created_at: string | null;
  archived: boolean;
}

export interface MemberQuoteData {
  price: number;
  created_at: string | null;
  request_title: string | null;
  request_slug: string | null;
}

export interface MemberProfileData extends MemberCardData {
  /** Plain text skills, for the page description only (older API). */
  skills: string;
  requests: MemberRequestData[];
  quotes: MemberQuoteData[];
}

export function toMemberCard(m: Obj): MemberCardData {
  return {
    name: text(m.name) ?? text(m.display_name) ?? 'Community member',
    slug: slug(m.slug),
    avatar: imageUrl(m.avatar !== undefined ? m.avatar : m.profile_image_url),
    member_since: date(m.member_since) ?? date(m.user_registered),
    request_count: count(m.request_count),
    quote_count: count(m.quote_count),
  };
}

export function toMemberProfile(m: Obj): MemberProfileData {
  return {
    ...toMemberCard(m),
    skills: plainText(html(m.skills)),
    requests: list(m.requests)
      .map((r) => ({
        id: whole(r.id),
        title: text(r.title) ?? 'Untitled request',
        slug: slug(r.slug),
        type: text(r.type),
        budget: amount(r.budget),
        created_at: date(r.created_at),
        archived: r.archived === true,
      }))
      .slice(0, 20),
    quotes: list(m.quotes)
      .map((q) => {
        const title = text(q.request_title);
        return {
          price: amount(q.price),
          created_at: date(q.created_at),
          // The older API says "Unknown" when the request is gone.
          request_title: title && title !== 'Unknown' ? title : null,
          request_slug: slug(q.request_slug),
        };
      })
      .slice(0, 20),
  };
}

/** One page of GET /api/teamwork. */
export function toMemberList(data: unknown, requestedPage: number, perPage: number): ListPage<MemberCardData> {
  const d = isObj(data) ? data : {};
  const items = list(d.members ?? d.data).map(toMemberCard);
  return { items, ...pageInfo(d, requestedPage, perPage, items.length) };
}

/** True for a JSON object that describes one record (has an id or a slug). */
export function isRecord(value: unknown): value is Obj {
  return isObj(value) && !('error' in value) && (whole(value.id) !== null || text(value.slug) !== null);
}
