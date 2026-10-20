export type JsonLdObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonLdObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * JSON for a <script type="application/ld+json"> tag. `<` is escaped so a value containing
 * "</script>" can never close the tag early (Next.js JSON-LD guide).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function parseJsonObjects(json: string): JsonLdObject[] {
  const text = json.trim();
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.filter(isPlainObject);
    return isPlainObject(parsed) && Object.keys(parsed).length > 0 ? [parsed] : [];
  } catch {
    return [];
  }
}

/**
 * Parses the schema markup an editor pasted into a tip. Accepts plain JSON, or one or more
 * <script type="application/ld+json"> blocks. Returns null when it is missing or not valid JSON-LD,
 * so the caller can fall back to the generated schema.
 */
export function parseCustomSchema(raw: unknown): JsonLdObject | JsonLdObject[] | null {
  if (typeof raw !== 'string') return null;
  const source = raw.replace(/<!--[\s\S]*?-->/g, '');
  const blocks = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map((match) => match[1]);
  // Every pasted block must parse; one broken block means the editor's markup is broken.
  const parts = (blocks.length > 0 ? blocks : [source]).map(parseJsonObjects);
  if (parts.some((items) => items.length === 0)) return null;
  const items = parts.flat();
  if (items.length === 0) return null;
  return items.length === 1 ? items[0] : items;
}

function typesOf(node: JsonLdObject): string[] {
  const type = node['@type'];
  if (typeof type === 'string') return [type];
  return Array.isArray(type) ? type.filter((t): t is string => typeof t === 'string') : [];
}

const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'TechArticle', 'NewsArticle', 'Report', 'ScholarlyArticle']);

export interface CustomSchemaResult {
  schema: JsonLdObject | JsonLdObject[] | null;
  /** True when the editor's schema describes the page as an article (so no generated Article is needed). */
  hasArticle: boolean;
}

/**
 * Makes an editor's hand-written schema agree with the page:
 * - nodes of the `drop` types are removed (the page generates those itself from what it shows, e.g. FAQPage
 *   from the visible FAQs and BreadcrumbList from the real path), so hidden or stale copies never ship;
 * - article nodes get the page's real facts (`facts`: dates, author, URL) and keep everything else the editor wrote.
 */
export function reconcileCustomSchema(
  custom: JsonLdObject | JsonLdObject[] | null,
  facts: JsonLdObject,
  defaults: JsonLdObject,
  drop: string[],
): CustomSchemaResult {
  if (!custom) return { schema: null, hasArticle: false };
  let hasArticle = false;

  const fixNode = (node: JsonLdObject): JsonLdObject | null => {
    const types = typesOf(node);
    if (types.some((t) => drop.includes(t))) return null;
    if (types.some((t) => ARTICLE_TYPES.has(t))) {
      hasArticle = true;
      return { ...defaults, ...node, ...facts };
    }
    return node;
  };

  const fixTop = (node: JsonLdObject): JsonLdObject | null => {
    if (Array.isArray(node['@graph'])) {
      const graph = node['@graph'].filter(isPlainObject).map(fixNode).filter((n): n is JsonLdObject => n !== null);
      return graph.length > 0 ? { ...node, '@graph': graph } : null;
    }
    return fixNode(node);
  };

  const list = (Array.isArray(custom) ? custom : [custom]).map(fixTop).filter((n): n is JsonLdObject => n !== null);
  if (list.length === 0) return { schema: null, hasArticle: false };
  return { schema: Array.isArray(custom) ? list : list[0], hasArticle };
}

/** BreadcrumbList for the trail a page shows: names with site paths ("/" for Home), the last one being the page itself. */
export function breadcrumbList(items: { name: string; path: string }[], siteUrl: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteUrl).toString(),
    })),
  };
}
