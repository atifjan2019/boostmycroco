import type { Metadata } from 'next';

/** Public site address. Every canonical URL, sitemap entry and JSON-LD id is built from it. */
export const SITE_URL = 'https://www.boostmycroco.com';
export const SITE_NAME = 'BoostMyCroco';
export const DEFAULT_TITLE = 'BoostMyCroco — Crocoblock Community Marketplace';
export const DEFAULT_DESCRIPTION =
  'Post requests, get quotes, and connect with expert Crocoblock developers in the BoostMyCroco community.';

/**
 * Title template for child pages. A layout that sets a plain string title stops the root template from
 * reaching the pages below it, so such layouts must repeat this template.
 */
export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

/**
 * Metadata for 404 responses (Next.js adds the noindex tag itself). The canonical and share tags are
 * cleared so a 404 under /requests or /teamwork does not inherit the parent page's canonical.
 */
export const NOT_FOUND_METADATA: Metadata = {
  title: { absolute: `Page Not Found | ${SITE_NAME}` },
  description: 'The requested page could not be found.',
  alternates: null,
  openGraph: null,
  twitter: null,
};

/** Share image used when a page has none of its own (public/og-default.png, 1200x630). */
export const DEFAULT_OG_IMAGE = {
  url: '/og-default.png',
  width: 1200,
  height: 630,
  alt: 'BoostMyCroco: expert help with Crocoblock and JetEngine',
};

/**
 * Laravel API base for server-side fetches. Vercel sets NEXT_PUBLIC_BACKEND_URL; the fallback is the
 * live public API so a local `next build` works without an .env file.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://admin.boostmycroco.com').replace(/\/+$/, '');

export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).toString();
}

/** Slugs we are willing to send to the API: letters, digits, dashes and underscores only. */
export function isSafeSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(slug);
}

type ShareImage = { url: string; width?: number; height?: number; alt?: string };

interface PageMetaInput {
  /** A plain string goes through the root title template ("%s | BoostMyCroco"). */
  title: string | { absolute: string };
  description: string;
  /** Canonical path (or absolute URL), e.g. "/requests" or "/tips-and-tricks?page=2". */
  path: string;
  images?: ShareImage[];
  noindex?: boolean;
}

/**
 * Complete metadata for one page: title, description, canonical, Open Graph and Twitter card.
 * Next.js merges metadata shallowly, so a page that sets `openGraph` replaces the root one entirely;
 * building the whole block here keeps the site name and default share image on every page.
 */
export function pageMetadata({ title, description, path, images, noindex }: PageMetaInput): Metadata {
  const shareTitle = typeof title === 'string' ? title : title.absolute;
  const shareImages = images && images.length > 0 ? images : [DEFAULT_OG_IMAGE];

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title: shareTitle,
      description,
      images: shareImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: shareImages.map((image) => image.url),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
