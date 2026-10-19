import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isSafeSlug, NOT_FOUND_METADATA, pageMetadata } from '@/lib/site';
import { getMemberProfile, plural, type MemberProfile, type Lookup } from '@/lib/community';
import { plainText, truncate } from '@/lib/text';

// The profile page is a client component; this server layout gives it a real title, description and
// canonical, and a 404 for members that do not exist. Built on first visit, refreshed every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

type Params = Promise<{ slug: string }>;

/**
 * Looks the slug up. generateMetadata only reads the result (calling notFound() there makes Next.js
 * render a bare error document without a title); the layout below is what returns the 404.
 */
async function loadMember(slug: string): Promise<Lookup<MemberProfile>> {
  if (!isSafeSlug(slug)) return { status: 'missing' };
  return getMemberProfile(slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadMember(slug);
  if (result.status === 'missing') return NOT_FOUND_METADATA;
  const member = result.status === 'found' ? result.data : null;

  if (!member) {
    return pageMetadata({
      title: 'Community Member',
      description: 'A member of the BoostMyCroco Crocoblock community.',
      path: `/teamwork/${slug}`,
    });
  }

  const name = member.display_name?.trim() || 'Community Member';
  const requests = typeof member.request_count === 'number' ? member.request_count : 0;
  const quotes = typeof member.quote_count === 'number' ? member.quote_count : 0;
  const skills = typeof member.skills === 'string' ? plainText(member.skills) : '';
  const summary = `${name} is a member of the BoostMyCroco Crocoblock community: ${plural(requests, 'request')} posted and ${plural(quotes, 'quote')} given.`;
  // The API matches names loosely, so several URLs can reach one member; point them all at one canonical.
  const canonicalSlug = member.slug && isSafeSlug(member.slug) ? member.slug : slug;

  return pageMetadata({
    title: `${name} – Community Member`,
    description: truncate(skills ? `${summary} Skills: ${skills}` : summary, 155),
    path: `/teamwork/${canonicalSlug}`,
  });
}

export default async function MemberLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { slug } = await params;
  if ((await loadMember(slug)).status === 'missing') notFound();
  return <>{children}</>;
}
