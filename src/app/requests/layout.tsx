import type { Metadata } from 'next';
import { TITLE_TEMPLATE } from '@/lib/site';

// Each page under /requests sets its own title, description and canonical. The template is repeated here so a
// request page's title always ends in "| BoostMyCroco".
export const metadata: Metadata = {
  title: { default: 'Crocoblock & JetEngine Help Requests', template: TITLE_TEMPLATE },
};

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
