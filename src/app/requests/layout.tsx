import type { Metadata } from 'next';
import { pageMetadata, TITLE_TEMPLATE } from '@/lib/site';

const title = 'Crocoblock & JetEngine Help Requests';

// The requests page is a client component, so its metadata lives in this server layout.
export const metadata: Metadata = {
  ...pageMetadata({
    title,
    description:
      'Browse help requests from the Crocoblock community: JetEngine, JetSmartFilters, JetFormBuilder and Elementor projects looking for free help, quotes or offers.',
    path: '/requests',
  }),
  // default + template (not a plain string) so "| BoostMyCroco" still reaches /requests/[slug].
  title: { default: title, template: TITLE_TEMPLATE },
};

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
