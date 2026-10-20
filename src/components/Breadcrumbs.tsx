import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  name: string;
  /** Site path; the last crumb (the page itself) is shown without a link. */
  path: string;
}

/** Visible breadcrumb trail. Give the same items to breadcrumbList() for the page's BreadcrumbList schema. */
export default function Breadcrumbs({ items, className = 'mb-6' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && <ChevronRight aria-hidden="true" className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              {isLast ? (
                <span aria-current="page" className="text-slate-700 line-clamp-1 break-words">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="inline-block py-1 hover:text-primary transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
