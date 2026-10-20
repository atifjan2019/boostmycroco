import type { QuoteData } from '@/lib/public-api';
import { safeMemberHtml } from '@/lib/safe-html';
import { formatMoney, isoDate, shortDate } from '@/lib/text';

/** Name shown for a quote whose bidder left no name. */
export const UNNAMED_BIDDER = 'Community member';

/**
 * One public quote: bidder name, price, message (member HTML, cleaned here) and date. Used for the server-rendered
 * list and for a quote just sent from the page, so both look the same. The message sits in a plain <div>, as
 * src/lib/safe-html.ts requires.
 */
export default function QuoteItem({ quote: q }: { quote: QuoteData }) {
  const posted = shortDate(q.created_at);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-w-0">
      <div className="flex justify-between items-start gap-3 mb-4">
        <span className="font-bold text-slate-800 break-words min-w-0">{q.name || UNNAMED_BIDDER}</span>
        {q.price > 0 && <span className="text-emerald-600 font-black text-lg shrink-0">{formatMoney(q.price)}</span>}
      </div>
      <div
        className="text-slate-600 text-[15px] leading-relaxed mb-4 prose prose-sm max-w-none member-html"
        dangerouslySetInnerHTML={{ __html: safeMemberHtml(q.message) }}
      />
      {posted && (
        <div className="text-slate-400 text-xs font-semibold pt-4 border-t border-slate-100 mt-2">
          <time dateTime={isoDate(q.created_at)}>{posted}</time>
        </div>
      )}
    </div>
  );
}
