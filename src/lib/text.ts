const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  reg: '®',
  trade: '™',
};

function decodeEntity(match: string, entity: string): string {
  if (entity[0] === '#') {
    const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return match;
  }
  return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
}

/** Inline elements: their tags join text without a space ("a <a>demo grid</a>." reads "a demo grid."). */
const INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'font', 'i', 'ins', 'kbd', 'mark', 'q', 's',
  'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var',
]);

/**
 * Visible text of an HTML fragment, with tags removed, common entities decoded and spaces collapsed. Block tags
 * (paragraphs, headings, list items, line breaks) become a space so their text does not run together; inline tags vanish.
 */
export function plainText(html?: string | null): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<\/?([a-z][a-z0-9-]*)\b[^>]*>|<[^>]*>/gi, (_tag, name?: string) =>
      name && INLINE_TAGS.has(name.toLowerCase()) ? '' : ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, decodeEntity)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Visible text of the HTML with its headings left out, for summaries that should read as sentences
 * (a heading would otherwise run straight into the first sentence).
 */
export function bodyText(html?: string | null): string {
  if (!html || typeof html !== 'string') return '';
  return plainText(html.replace(/<h([1-6])\b[^>]*>[\s\S]*?<\/h\1\s*>/gi, ' '));
}

/** Shortens text to at most `max` characters, cutting at a word boundary and adding an ellipsis. */
export function truncate(text: string, max = 155): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s,;:.\-–—]+$/, '') + '…';
}

/** Escapes a value for use inside a double-quoted HTML attribute. */
export function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** "19 October 2026" style date, or '' when the value is not a date. */
export function formatDate(value: string | null | undefined, month: 'long' | 'short' = 'long'): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month, year: 'numeric', timeZone: 'UTC' });
}

/**
 * The date as "2026-10-19T08:00:00.000Z", or undefined when it is not a date. The API sends Laravel's
 * six-digit fractions ("…00.000000Z"), which HTML's datetime attribute does not allow.
 */
export function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "21 Oct 2024" (in UTC), or '' when the value is not a date. Month names are fixed here because browsers and Node
 * disagree on short month names ("Sep" or "Sept"), which would also make server and browser output differ.
 */
export function shortDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "$150" or "$1,250.50" for a price or budget. */
export function formatMoney(amount: number): string {
  const fixed = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const [whole, cents] = fixed.split('.');
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${cents ? `.${cents}` : ''}`;
}
