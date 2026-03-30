import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'BoostMyCroco — Crocoblock Community Marketplace',
  description: 'Post requests, get quotes, and connect with expert Crocoblock developers in the BoostMyCroco community.',
  icons: { icon: '/Favi.png', apple: '/Favi.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BoostMyCroco",
    "url": "https://www.boostmycroco.com",
    "logo": "https://www.boostmycroco.com/Favi.png",
    "description": "Post requests, get quotes, and connect with expert Crocoblock developers in the BoostMyCroco community."
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <script
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
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
