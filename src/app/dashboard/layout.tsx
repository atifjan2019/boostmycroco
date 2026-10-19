import type { Metadata } from 'next';
import DashboardShell from './DashboardShell';

// Members-only area: keep it out of search results (robots.txt also disallows /dashboard/).
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
