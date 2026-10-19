import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

// The page is a client component, so its metadata lives in this server layout.
export const metadata: Metadata = pageMetadata({
  title: 'Make a Request: Get Crocoblock Help',
  description:
    'Describe your Crocoblock, JetEngine or Elementor problem and get free help, paid quotes or offers from experienced community developers.',
  path: '/make-a-request',
});

export default function MakeARequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
