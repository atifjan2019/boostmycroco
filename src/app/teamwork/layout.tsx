import type { Metadata } from 'next';
import { pageMetadata, TITLE_TEMPLATE } from '@/lib/site';

const title = 'TeamWork: Crocoblock Community Members';

// The TeamWork page is a client component, so its metadata lives in this server layout.
export const metadata: Metadata = {
  ...pageMetadata({
    title,
    description:
      'Meet the BoostMyCroco community: Crocoblock and JetEngine developers and site builders, with the requests they posted and the quotes they gave.',
    path: '/teamwork',
  }),
  // default + template (not a plain string) so "| BoostMyCroco" still reaches /teamwork/[slug].
  title: { default: title, template: TITLE_TEMPLATE },
};

export default function TeamworkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
