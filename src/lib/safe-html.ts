/**
 * Second layer for member-written HTML shown with dangerouslySetInnerHTML (request descriptions, quote messages).
 *
 * The API already cleans this HTML (backend App\Support\RichText + HtmlCleaner, same tag list as below). This copy
 * runs in the browser so that an older backend, a missed code path or a hand-edited row still cannot put a script,
 * an event handler or a javascript: link on the page, where it could read the sign-in token in localStorage.
 *
 * It rebuilds the HTML from scratch: only the tags and attributes listed here are created, everything else is
 * unwrapped (its text kept) or, for elements whose content is code or a widget, dropped with its content.
 * Browser only (DOMParser). Without a DOM it returns '' (the request page loads its data in the browser anyway).
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

/** Editor tags renamed to the nearest allowed one, as the backend does (Trix writes <div> paragraphs and <h1>). */
const RENAME: Record<string, string> = { div: 'p', h1: 'h2', h5: 'h4', h6: 'h4', del: 's', strike: 's' };

/** Removed together with everything inside them. */
const DROP = new Set([
  'script', 'style', 'template', 'noscript', 'noembed', 'noframes', 'xmp', 'plaintext', 'title',
  'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'portal',
  'svg', 'math', 'canvas', 'video', 'audio', 'source', 'track', 'picture',
  'form', 'input', 'textarea', 'select', 'option', 'button',
  'head', 'link', 'meta', 'base',
]);

// Characters browsers ignore inside a URL scheme ("java\tscript:"), stripped before the scheme is checked.
const IGNORED_IN_URL = /[\u0000-\u0020\u007f-\u009f]/g;
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/** The URL when its scheme is allowed (links: http, https, mailto or a site path; images: https only), else null. */
function safeUrl(value: string, kind: 'link' | 'image'): string | null {
  const compact = value.replace(IGNORED_IN_URL, '');
  const scheme = SCHEME.exec(compact)?.[1]?.toLowerCase();
  if (kind === 'image') return scheme === 'https' ? value.trim() : null;
  if (!scheme) return compact.startsWith('//') || compact.startsWith('\\') ? null : value.trim();
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto' ? value.trim() : null;
}

/** "language-php" style classes only (syntax highlighting); any other class could pick up the site's own styles. */
function languageClasses(value: string): string {
  return value.split(/\s+/).filter(token => /^language-[a-z0-9_.#+-]{1,40}$/i.test(token)).join(' ');
}

function copyChildren(from: Node, to: Node, doc: Document, depth: number) {
  if (depth > 100) return;
  from.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      to.appendChild(doc.createTextNode(child.textContent ?? ''));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return; // comments, processing instructions

    const source = child as Element;
    const name = source.localName.toLowerCase();
    if (DROP.has(name) || source.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;

    const tag = RENAME[name] ?? name;
    const attributes = ALLOWED[tag];
    if (!attributes) {
      copyChildren(source, to, doc, depth + 1); // unknown wrapper (font, section, …): keep its text
      return;
    }

    const el = doc.createElement(tag);
    for (const attr of attributes) {
      const value = source.getAttribute(attr);
      if (value === null) continue;
      if (attr === 'href') {
        const url = safeUrl(value, 'link');
        if (url) el.setAttribute('href', url);
      } else if (attr === 'src') {
        const url = safeUrl(value, 'image');
        if (url) el.setAttribute('src', url);
      } else if (attr === 'class') {
        const classes = languageClasses(value);
        if (classes) el.setAttribute('class', classes);
      } else {
        el.setAttribute(attr, value.slice(0, 200));
      }
    }
    if (tag === 'a') el.setAttribute('rel', 'nofollow ugc noopener noreferrer');
    if (tag === 'img') {
      if (!el.hasAttribute('src')) return; // an image with no safe address shows nothing
      el.setAttribute('loading', 'lazy');
    }

    copyChildren(source, el, doc, depth + 1);
    to.appendChild(el);
  });
}

/** Member HTML reduced to the allowed tags and attributes, ready for dangerouslySetInnerHTML. */
export function safeMemberHtml(html: string | null | undefined): string {
  if (!html || typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';
  // DOMParser documents are inert: nothing in them runs or loads while they are read.
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const out = document.implementation.createHTMLDocument('');
  const root = out.createElement('div');
  copyChildren(parsed.body, root, out, 0);
  return root.innerHTML;
}
