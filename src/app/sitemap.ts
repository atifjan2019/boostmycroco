import type { MetadataRoute } from 'next';
import { listPath } from '@/components/Pagination';
import { SITE_URL } from '@/lib/site';
import { getListLastPages, getMemberPages, getRequestPages, getTipPages, type SitemapPage } from '@/lib/sitemap-data';

// Time-based refresh: the sitemap and the API answers behind it are kept for an hour (the same value as
// SITEMAP_REVALIDATE; Next needs a plain number here). After that the next visit still gets the old copy and rebuilds
// it in the background; if that rebuild fails, the old copy stays. On-demand refresh: the backend posts "/sitemap.xml"
// to /api/revalidate after a request, quote or tip changes; revalidatePath('/sitemap.xml') expires this copy and the
// cached API answers it was built from, so the next visit waits for a rebuild from fresh data. That rebuild has no old
// copy to fall back on: while the API fails, visits get an error until it answers again.
export const revalidate = 3600;

/** Guard against a broken page count in an API answer (1,000 pages is 12,000 rows; the lists hold about 50 today). */
const MAX_LIST_PAGES = 1000;

function toDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function newestDate(pages: SitemapPage[]): Date | undefined {
  let newest: Date | undefined;
  for (const page of pages) {
    const date = toDate(page.lastModified);
    if (date && (!newest || date > newest)) newest = date;
  }
  return newest;
}

/**
 * Pages 2 to the last of a list, at the address each one gives as its canonical ("/requests?page=2"). No lastmod: no
 * date says when the rows on one page last changed.
 */
function listPages(basePath: string, lastPage: number): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];
  for (let page = 2; page <= Math.min(lastPage, MAX_LIST_PAGES); page++) {
    routes.push({ url: `${SITE_URL}${listPath(basePath, page)}` });
  }
  return routes;
}

function pageRoutes(pages: SitemapPage[], extra: Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'> = {}) {
  return pages.map((page) => ({ url: `${SITE_URL}${page.path}`, lastModified: toDate(page.lastModified), ...extra }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tipsRead, requestsRead, membersRead, listsRead] = await Promise.allSettled([
    getTipPages(),
    getRequestPages(),
    getMemberPages(),
    getListLastPages(),
  ]);

  // At runtime any failed read throws, which keeps the last good sitemap in the cache when there is one (and retries
  // on the next visit) instead of replacing it with a shorter one. A build has no earlier sitemap, so there it lists
  // what it could read and the next refresh adds the rest.
  const failed = [tipsRead, requestsRead, membersRead, listsRead].find((read) => read.status === 'rejected');
  if (failed && process.env.NEXT_PHASE !== 'phase-production-build') throw failed.reason;

  const tips = tipsRead.status === 'fulfilled' ? tipsRead.value : [];
  // null: the API has no requests or members endpoint yet (older API), so those pages are left out.
  const requests = requestsRead.status === 'fulfilled' ? (requestsRead.value ?? []) : [];
  const members = membersRead.status === 'fulfilled' ? (membersRead.value ?? []) : [];
  const lastPages = listsRead.status === 'fulfilled' ? listsRead.value : { requests: 1, teamwork: 1, tips: 1 };

  // Fixed pages carry no lastModified: a date that changes on every rebuild tells search engines nothing. The two list
  // pages that have a real date carry it: the newest request activity and the newest tip.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/requests`, lastModified: newestDate(requests), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/tips-and-tricks`, lastModified: newestDate(tips), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/make-a-request`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/teamwork`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const routes: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...listPages('/requests', lastPages.requests),
    ...listPages('/teamwork', lastPages.teamwork),
    ...listPages('/tips-and-tricks', lastPages.tips),
    ...pageRoutes(requests),
    ...pageRoutes(members),
    ...pageRoutes(tips, { changeFrequency: 'monthly', priority: 0.7 }),
  ];

  // Each address once, even if two lists ever name the same page.
  const seen = new Set<string>();
  return routes.filter((route) => {
    if (seen.has(route.url)) return false;
    seen.add(route.url);
    return true;
  });
}
