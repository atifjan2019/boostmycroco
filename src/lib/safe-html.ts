/**
 * Second layer for member-written HTML (request descriptions, quote messages) put on the page with
 * dangerouslySetInnerHTML.
 *
 * The API already cleans this HTML (backend App\Support\RichText + HtmlCleaner, same tag list as below). This copy
 * runs wherever the page is built, on the server for the first HTML and in the browser for a quote added on the
 * page, so an older backend, a missed code path or a hand-edited row still cannot put a script, an event handler or
 * a javascript: link on the page, where it could read the sign-in token in localStorage. It works on the text
 * alone (no DOM), so the server and the browser produce exactly the same HTML.
 *
 * It rebuilds the HTML from scratch: only the tags and attributes listed here are written, every attribute value
 * is re-escaped, all text is escaped, and anything that is not a well-formed tag is shown as text. Other tags are
 * unwrapped (their text kept); elements whose content is code or a widget are dropped with their content. Every tag
 * it opens is closed again, so member HTML can never leave its container or turn the rest of the page into a link.
 *
 * Containers for this HTML must be plain <div>s that are not inside a <p>, <li>, heading, <a> or table: then even
 * an end tag the browser closes differently than this code expects cannot reach outside the container.
 */

/** Allowed elements and their attributes: HtmlCleaner's list without "id" (member ids could clash with page globals). */
const ALLOWED: Record<string, readonly string[]> = {
  p: [], br: [], hr: [],
  h2: [], h3: [], h4: [],
  ul: [], ol: ['start'], li: [],
  blockquote: [], figure: [], figcaption: [],
  pre: ['class'], code: ['class'],
  table: [], thead: [], tbody: [], tr: [],
  th: ['scope', 'colspan', 'rowspan'], td: ['colspan', 'rowspan'],
  strong: [], b: [], em: [], i: [], u: [], s: [], kbd: [], mark: [],
  sub: [], sup: [], span: [], small: [],
  a: ['href', 'title'],
  img: ['src', 'alt', 'width', 'height'],
};

const VOID = new Set(['br', 'hr', 'img']);

/** Editor tags renamed to the nearest allowed one, as the backend does (Trix writes <div> paragraphs and <h1>). */
const RENAME: Record<string, string> = { div: 'p', h1: 'h2', h5: 'h4', h6: 'h4', del: 's', strike: 's' };

/** Removed together with everything inside them. */
const DROP = new Set([
  'script', 'style', 'template', 'noscript', 'noembed', 'noframes', 'xmp', 'plaintext', 'title', 'textarea',
  'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'portal',
  'svg', 'math', 'canvas', 'video', 'audio', 'source', 'track', 'picture',
  'form', 'input', 'select', 'option', 'button',
  'head', 'link', 'meta', 'base',
]);

/** Opening one of these closes an open paragraph first, as the browser's parser does. */
const CLOSES_P = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'figure', 'figcaption', 'pre', 'table', 'hr']);

const HEADINGS = new Set(['h2', 'h3', 'h4']);

/** Every link in member HTML gets this rel (owner rule, 20 Oct 2026). */
export const MEMBER_LINK_REL = 'ugc nofollow noopener noreferrer';

const MAX_DEPTH = 100;

/** A tag: name, then attributes (quoted values may hold ">"), then an optional "/" and ">". */
// Attribute names never hold "<" and quoted values are capped, so a broken tag fails fast instead of making the regex
// rescan the rest of the text from every "<".
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]{0,4000}"|'[^']{0,4000}'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
/** A "&" that does not start a character reference ("&amp;", "&#39;", "&#x27;"). */
const LONE_AMP = /&(?!(?:#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});)/g;

/** Text as HTML: character references are kept (so "&eacute;" still shows é), everything else is escaped. */
function escapeText(text: string): string {
  return text.replace(LONE_AMP, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

/** Numeric character references and the few named ones that matter in a URL, decoded. */
function decodeForUrl(value: string): string {
  return value
    .replace(/&#(\d{1,7});?/g, (m, d: string) => fromCode(parseInt(d, 10), m))
    .replace(/&#[xX]([0-9a-fA-F]{1,6});?/g, (m, h: string) => fromCode(parseInt(h, 16), m))
    .replace(/&(amp|colon|sol|period|tab|newline|quot|apos|lt|gt);?/gi, (_m, name: string) =>
      ({ amp: '&', colon: ':', sol: '/', period: '.', tab: '\t', newline: '\n', quot: '"', apos: "'", lt: '<', gt: '>' })[
        name.toLowerCase() as 'amp'
      ] ?? '');
}

function fromCode(code: number, fallback: string): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(code);
  } catch {
    return fallback;
  }
}

/**
 * The address when it is an absolute http(s) URL (images: https only), normalised by the URL parser, else null.
 * Relative links, mailto: (an email address in public HTML) and every other scheme are dropped.
 */
function safeUrl(raw: string, kind: 'link' | 'image'): string | null {
  const value = decodeForUrl(raw).trim();
  if (!(kind === 'image' ? /^https:\/\//i : /^https?:\/\//i).test(value)) return null;
  try {
    const url = new URL(value);
    if (kind === 'image' ? url.protocol !== 'https:' : url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** "language-php" style classes only (syntax highlighting); any other class could pick up the site's own styles. */
function languageClasses(value: string): string {
  return value
    .split(/\s+/)
    .filter((token) => /^language-[a-z0-9_.#&;+-]{1,40}$/i.test(token))
    .join(' ');
}

function readAttributes(source: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = match[1].toLowerCase();
    // The first copy of an attribute wins, as in the browser.
    if (!found.has(name)) found.set(name, match[2] ?? match[3] ?? match[4] ?? '');
  }
  return found;
}

/** The attributes to write for an allowed tag, or null when the tag must be left out (a link or image with no safe address). */
function buildAttributes(tag: string, source: string): string | null {
  const given = readAttributes(source);
  let out = '';
  for (const name of ALLOWED[tag]) {
    const value = given.get(name);
    if (value === undefined) continue;
    if (name === 'href' || name === 'src') {
      const url = safeUrl(value, name === 'src' ? 'image' : 'link');
      if (url) out += ` ${name}="${escapeAttr(url)}"`;
    } else if (name === 'class') {
      const classes = languageClasses(value);
      if (classes) out += ` class="${escapeAttr(classes)}"`;
    } else if (name === 'width' || name === 'height' || name === 'start' || name === 'colspan' || name === 'rowspan') {
      if (/^\d{1,4}$/.test(value.trim())) out += ` ${name}="${value.trim()}"`;
    } else if (name === 'scope') {
      const scope = value.trim().toLowerCase();
      if (['row', 'col', 'rowgroup', 'colgroup'].includes(scope)) out += ` scope="${scope}"`;
    } else {
      out += ` ${name}="${escapeAttr(value.slice(0, 200))}"`;
    }
  }
  if (tag === 'a') {
    if (!out.includes(' href="')) return null;
    out += ` rel="${MEMBER_LINK_REL}"`;
  }
  if (tag === 'img') {
    if (!out.includes(' src="')) return null;
    out += ' loading="lazy" decoding="async"';
  }
  return out;
}

/** Member HTML reduced to the allowed tags and attributes, ready for dangerouslySetInnerHTML. Same result on server and browser. */
export function safeMemberHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return '';

  const source = html
    .replace(/\u0000/g, '')
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<[!?][^>]*>?/g, '');

  const stack: string[] = [];
  let out = '';

  const closeTo = (index: number) => {
    while (stack.length > index) out += `</${stack.pop()}>`;
  };

  let last = 0;
  TAG.lastIndex = 0;
  for (let match = TAG.exec(source); match; match = TAG.exec(source)) {
    out += escapeText(source.slice(last, match.index));
    last = TAG.lastIndex;

    const closing = match[1] === '/';
    const name = match[2].toLowerCase();

    if (!closing && DROP.has(name)) {
      // Skip to the matching end tag (or the end of the text when there is none).
      const end = new RegExp(`</${name}\\s*>`, 'ig');
      end.lastIndex = last;
      const found = end.exec(source);
      last = found ? end.lastIndex : source.length;
      TAG.lastIndex = last;
      continue;
    }

    const tag = RENAME[name] ?? name;
    if (!ALLOWED[tag]) continue; // unknown wrapper (font, section, …): its text is kept

    if (closing) {
      const index = stack.lastIndexOf(tag);
      if (index !== -1) closeTo(index);
      continue;
    }

    const attributes = buildAttributes(tag, match[3]);
    if (attributes === null) continue;

    if (CLOSES_P.has(tag)) {
      const p = stack.lastIndexOf('p');
      if (p !== -1) closeTo(p);
    }
    if (HEADINGS.has(tag) && HEADINGS.has(stack[stack.length - 1])) {
      // A heading inside a heading ends the first one.
      closeTo(stack.length - 1);
    }
    if (tag === 'li') {
      // A new item closes the open one in the same list.
      const li = stack.lastIndexOf('li');
      if (li !== -1 && li > Math.max(stack.lastIndexOf('ul'), stack.lastIndexOf('ol'))) closeTo(li);
    }
    if (tag === 'a') {
      // Links cannot be nested.
      const a = stack.lastIndexOf('a');
      if (a !== -1) closeTo(a);
    }

    if (VOID.has(tag)) {
      out += `<${tag}${attributes}>`;
    } else if (stack.length < MAX_DEPTH) {
      out += `<${tag}${attributes}>`;
      stack.push(tag);
    }
  }
  out += escapeText(source.slice(last));
  closeTo(0);
  return out;
}
