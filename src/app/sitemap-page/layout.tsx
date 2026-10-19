import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

// The page is a client component, so its metadata lives in this server layout.
export const metadata: Metadata = pageMetadata({
  title: 'Sitemap',
  description: 'Every page on BoostMyCroco: requests, the TeamWork directory and all tips and tricks.',
  path: '/sitemap-page',
});

export default function SitemapPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
