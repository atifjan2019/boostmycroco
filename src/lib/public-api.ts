/**
 * What the site's own /api routes pass on from the Laravel API: only the fields the pages render. Anything
 * else the backend sends (email addresses, internal columns) is dropped here, so it never reaches a browser
 * even if the backend starts returning it again.
 */

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const text = (v: unknown): string | null => (typeof v === 'string' ? v : null);
/** Ids are numbers; decimals (price, budget) arrive as strings such as "150.00". */
const scalar = (v: unknown): number | string | null => (typeof v === 'number' || typeof v === 'string' ? v : null);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : []);

/** True for a JSON object that describes one record (has an id). */
export function isRecord(value: unknown): value is Obj {
  return isObj(value) && scalar(value.id) !== null;
}

function memberCard(m: Obj) {
  return {
    id: scalar(m.id),
    display_name: text(m.display_name),
    user_registered: text(m.user_registered),
    slug: text(m.slug),
    request_count: count(m.request_count),
    quote_count: count(m.quote_count),
    profile_image_url: text(m.profile_image_url),
  };
}

/** /teamwork list page. */
export function publicMemberList(data: unknown) {
  const d = isObj(data) ? data : {};
  return {
    members: list(d.members).map(memberCard),
    total: count(d.total),
    page: count(d.page) || 1,
  };
}

/** /teamwork/[slug] profile page. */
export function publicMemberProfile(m: Obj) {
  return {
    ...memberCard(m),
    requests: list(m.requests).map(r => ({
      id: scalar(r.id),
      slug: text(r.slug),
      title: text(r.title),
      status: text(r.status),
      type: text(r.type),
      created_at: text(r.created_at),
    })),
    quotes: list(m.quotes).map(q => ({
      id: scalar(q.id),
      price: scalar(q.price),
      created_at: text(q.created_at),
      request_title: text(q.request_title),
    })),
  };
}

/** /requests/[slug] page: the request and its quotes (never the quoter's email). */
export function publicRequestDetail(r: Obj) {
  return {
    id: scalar(r.id),
    slug: text(r.slug),
    title: text(r.title),
    description: text(r.description),
    status: text(r.status),
    type: text(r.type),
    language: text(r.language),
    author_name: text(r.author_name),
    created_at: text(r.created_at),
    budget: scalar(r.budget),
    quotes: list(r.quotes).map(q => ({
      id: scalar(q.id),
      name: text(q.name),
      price: scalar(q.price),
      message: text(q.message),
      created_at: text(q.created_at),
    })),
  };
}
