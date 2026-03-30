import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.boostmycroco.com';

async function fetchAllTips(): Promise<{ slug: string; created_at: string }[]> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const tips: { slug: string; created_at: string }[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const res = await fetch(`${backendUrl}/api/tips-and-tricks?page=${page}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = await res.json();
      const batch = data.tips || [];
      const total = data.total || 0;
      tips.push(...batch);
      totalPages = Math.ceil(total / 12);
      page++;
    }

    return tips;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/requests`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/make-a-request`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/teamwork`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tips-and-tricks`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const tips = await fetchAllTips();
  const tipRoutes: MetadataRoute.Sitemap = tips.map((tip) => ({
    url: `${BASE_URL}/tips-and-tricks/${tip.slug}`,
    lastModified: new Date(tip.created_at),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...tipRoutes];
}
