import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

// The page is a client component, so its metadata lives in this server layout.
export const metadata: Metadata = pageMetadata({
  title: 'Create an Account',
  description: 'Join the BoostMyCroco Crocoblock community to post requests, send quotes and comment on tips.',
  path: '/register',
  noindex: true,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
