import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isSafeSlug, NOT_FOUND_METADATA, pageMetadata } from '@/lib/site';
import { getCommunityRequest, type CommunityRequest, type Lookup } from '@/lib/community';
import { plainText, truncate } from '@/lib/text';

// The page itself is a client component; this server layout gives it a real title, description and
// canonical, and a 404 for requests that do not exist. Built on first visit, refreshed every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

type Params = Promise<{ slug: string }>;

/**
 * Looks the slug up. generateMetadata only reads the result (calling notFound() there makes Next.js
 * render a bare error document without a title); the layout below is what returns the 404.
 */
async function loadRequest(slug: string): Promise<Lookup<CommunityRequest>> {
  if (!isSafeSlug(slug)) return { status: 'missing' };
  return getCommunityRequest(slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadRequest(slug);
  if (result.status === 'missing') return NOT_FOUND_METADATA;
  const request = result.status === 'found' ? result.data : null;

  if (!request) {
    return pageMetadata({
      title: 'Crocoblock Request',
      description: 'A help request from the BoostMyCroco Crocoblock community.',
      path: `/requests/${slug}`,
    });
  }

  const title = request.title?.trim() || 'Crocoblock Request';
  const text = plainText(request.description);
  const kind = request.type?.trim() ? `${request.type.trim()} request` : 'Request';
  // Requests opened by id link to the same canonical as the slug URL.
  const canonicalSlug = request.slug && isSafeSlug(request.slug) ? request.slug : slug;

  return pageMetadata({
    title,
    description: text ? truncate(text, 155) : `${kind} from the BoostMyCroco Crocoblock community: ${title}`,
    path: `/requests/${canonicalSlug}`,
  });
}

export default async function RequestLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { slug } = await params;
  if ((await loadRequest(slug)).status === 'missing') notFound();
  return <>{children}</>;
}
