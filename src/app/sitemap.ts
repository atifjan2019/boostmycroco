import type { MetadataRoute } from 'next';
import { isSafeSlug, SITE_URL } from '@/lib/site';
import { getTipSitemapEntries, type TipSitemapEntry } from '@/lib/tips';

// Rebuilt at most once an hour; a failed rebuild keeps serving the last good sitemap.
export const revalidate = 3600;

function toDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let tips: TipSitemapEntry[] = [];
  try {
    tips = await getTipSitemapEntries();
  } catch (error) {
    // At runtime, throwing keeps the last good sitemap (with every tip) in the cache and retries on the next
    // request; returning only the fixed pages would replace it for an hour. A build has no earlier sitemap,
    // so there it lists the fixed pages and the next hourly refresh adds the tips.
    if (process.env.NEXT_PHASE !== 'phase-production-build') throw error;
    tips = [];
  }

  // Only slugs the tip page will serve (it returns 404 for anything else), so the sitemap never lists a 404.
  const tipRoutes: MetadataRoute.Sitemap = tips.filter((tip) => isSafeSlug(tip.slug)).map((tip) => ({
    url: `${SITE_URL}/tips-and-tricks/${tip.slug}`,
    lastModified: toDate(tip.updated_at),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const newestTip = tipRoutes.reduce<Date | undefined>((newest, route) => {
    const date = route.lastModified instanceof Date ? route.lastModified : undefined;
    return date && (!newest || date > newest) ? date : newest;
  }, undefined);

  // Fixed pages carry no lastModified: a date that changes on every rebuild tells search engines nothing.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/requests`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/tips-and-tricks`, lastModified: newestTip, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/make-a-request`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/teamwork`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [...staticRoutes, ...tipRoutes];
}
