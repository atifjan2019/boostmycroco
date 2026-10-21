import Link from 'next/link';
import { ArchivedBadge, StatusBadge, TypeBadge } from '@/components/RequestBadges';
import { requestPath, type RequestCardData } from '@/lib/public-api';
import { formatMoney, isoDate, shortDate } from '@/lib/text';

/**
 * A request in a list. Only the title is a link; its ::after covers the whole card so the card stays clickable
 * (the "stretched link" pattern), and the focus ring is drawn on that cover so it outlines the card.
 * Works in server and client components (no hooks).
 */
export default function RequestCard({
  request: r,
  heading: Heading = 'h2',
  showExcerpt = true,
  showAuthor = true,
}: {
  request: RequestCardData;
  heading?: 'h2' | 'h3';
  showExcerpt?: boolean;
  showAuthor?: boolean;
}) {
  const href = requestPath(r);
  const created = shortDate(r.created_at);

  return (
    <article className="card p-6 relative flex flex-col h-full min-w-0">
      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {/* An archived request shows only "Archived": its stored status would read as still open. */}
          {r.archived ? <ArchivedBadge /> : r.status !== null && <StatusBadge status={r.status} />}
        </div>
        <TypeBadge type={r.type} />
      </div>
      <Heading className="font-bold text-[15px] leading-snug mb-3 text-slate-800 line-clamp-2 break-words">
        {href ? (
          <Link
            href={href}
            className="outline-none hover:text-primary transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2"
          >
            {r.title}
          </Link>
        ) : (
          r.title
        )}
      </Heading>
      {showExcerpt && r.excerpt && (
        <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-2 break-words">{r.excerpt}</p>
      )}
      <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
        <div className="text-xs font-semibold text-slate-500 min-w-0 truncate">
          {showAuthor && r.author_name ? `by ${r.author_name}` : ''}
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 shrink-0">
          {r.budget > 0 && <span className="text-emerald-600 font-bold">{formatMoney(r.budget)}</span>}
          {created && <time dateTime={isoDate(r.created_at)}>{created}</time>}
        </div>
      </div>
    </article>
  );
}
