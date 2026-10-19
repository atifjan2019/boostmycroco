import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import JsonLd from '@/components/JsonLd';
import CookieConsent from '@/components/CookieConsent';
import { ADSENSE_CLIENT, GA_MEASUREMENT_ID, gaConsentInitScript } from '@/lib/consent';
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  TITLE_TEMPLATE,
} from '@/lib/site';

// Pinch-zoom stays allowed (no maximumScale / userScalable): blocking it fails accessibility checks.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// No canonical here on purpose: a canonical in the root layout would be inherited by every page
// that does not set its own. Each page sets its canonical (see pageMetadata in src/lib/site.ts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: { icon: '/Favi.png', apple: '/Favi.png' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  // Google Search Console ownership check. Keep it: removing the tag un-verifies the property.
  verification: { google: '293QMIQnWeoKui3y-Xzv4Al-UaX_q8M-sfFUz1Lpc30' },
  // AdSense site ownership, so verification does not depend on the ad script (it only loads after consent).
  other: { 'google-adsense-account': ADSENSE_CLIENT },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/Favi.png'),
  description: DEFAULT_DESCRIPTION,
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      </head>
      <body>
        {/* Cookie banner first in the DOM so keyboard users reach it early. It also loads AdSense and Smartlook,
            and only after the visitor accepts (AdSense on every page, Smartlook never on /login, /register or
            /dashboard). Cloudflare Turnstile in <head> is a strictly necessary security check and stays as is. */}
        <CookieConsent />
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Google Analytics 4 (owner's tag, 19 Oct 2026) with Google Consent Mode v2. It loads for every visit:
            the init script sets consent to "denied" by default (no cookies, cookieless pings only) and switches it
            to "granted" at once when the visitor has already accepted. It runs before gtag.js so the default
            is in the dataLayer before anything else. Page changes inside the app are tracked by GA4's enhanced
            measurement (browser history events).
            Never give these scripts id="gtag" or id="dataLayer": an element id becomes a window property. */}
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: gaConsentInitScript() }}
        />
        <Script
          id="ga4-gtag-js"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
