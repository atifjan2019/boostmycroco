import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import JsonLd from '@/components/JsonLd';
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  TITLE_TEMPLATE,
} from '@/lib/site';

const ADSENSE_CLIENT = 'ca-pub-4404208402043493';
const GA_MEASUREMENT_ID = 'G-49GRTTFY43';

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
  // AdSense site ownership, so verification does not depend on the (now lazy-loaded) ad script.
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
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Google Analytics 4 (owner's tag, 19 Oct 2026): loads as soon as the page is interactive so every visit counts.
            Page changes inside the app are tracked by GA4's enhanced measurement (browser history events).
            Never give these scripts id="gtag" or id="dataLayer": an element id becomes a window property. */}
        <Script
          id="ga4-gtag-js"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
        {/* Ads and session recording load when the browser is idle, after the page itself.
            Ids are hyphenated on purpose: an element id becomes a window property, and id="smartlook"
            would make window.smartlook the <script> element, so the snippet below would skip its setup. */}
        <Script
          id="adsense-script"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <Script
          id="smartlook-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.smartlook||(function(d) {
                var o=smartlook=function(){ o.api.push(arguments)},h=d.getElementsByTagName('head')[0];
                var c=d.createElement('script');o.api=new Array();c.async=true;c.type='text/javascript';
                c.charset='utf-8';c.src='https://web-sdk.smartlook.com/recorder.js';h.appendChild(c);
              })(document);
              smartlook('init', '8d07c72b0956b8474c6b83331719135b9e7e9c30', { region: 'eu' });
            `,
          }}
        />
      </body>
    </html>
  );
}
