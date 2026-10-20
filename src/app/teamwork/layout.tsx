import type { Metadata } from 'next';
import { TITLE_TEMPLATE } from '@/lib/site';

// Each page under /teamwork sets its own title, description and canonical. The template is repeated here so a
// member page's title always ends in "| BoostMyCroco".
export const metadata: Metadata = {
  title: { default: 'TeamWork: Crocoblock Community Members', template: TITLE_TEMPLATE },
};

export default function TeamworkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
