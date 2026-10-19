import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

// The page is a client component, so its metadata lives in this server layout.
export const metadata: Metadata = pageMetadata({
  title: 'Log In',
  description: 'Log in to your BoostMyCroco account to post requests, send quotes and join the discussion.',
  path: '/login',
  noindex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
