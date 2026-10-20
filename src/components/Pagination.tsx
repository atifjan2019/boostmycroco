import Link from 'next/link';

/** "/requests" for page 1, "/requests?page=N" after it (the address each list page uses as its canonical). */
export function listPath(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/**
 * Page numbers to show: the first, the current one and its neighbours, and the last, with a gap marker where pages
 * are left out (a single left-out page is shown instead of a gap). At most 7 entries, which fit a 320 px screen.
 */
export function pageItems(page: number, lastPage: number): (number | 'gap')[] {
  const wanted = [...new Set([1, page - 1, page, page + 1, lastPage])]
    .filter((n) => n >= 1 && n <= lastPage)
    .sort((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  let previous = 0;
  for (const n of wanted) {
    if (n - previous === 2) items.push(previous + 1);
    else if (n - previous > 2) items.push('gap');
    items.push(n);
    previous = n;
  }
  return items;
}

export const PAGER_BUTTON = 'btn btn-outline bg-white hover:bg-slate-50';
export const PAGER_BUTTON_DISABLED = 'btn btn-outline bg-white opacity-50 cursor-not-allowed';
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

/** Crawlable page links for a server-rendered list: Prev / numbers / Next, rel="prev" / rel="next", aria-current. */
export default function Pagination({
  page,
  lastPage,
  basePath,
  label,
}: {
  page: number;
  lastPage: number;
  basePath: string;
  /** Name of the navigation landmark, e.g. "Requests pages". */
  label: string;
}) {
  if (lastPage <= 1) return null;

  return (
    <nav aria-label={label} className="mt-14 flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
      {page > 1 ? (
        <Link href={listPath(basePath, page - 1)} rel="prev" className={`${PAGER_BUTTON} ${FOCUS}`}>
          ← Prev
        </Link>
      ) : (
        <span aria-disabled="true" className={PAGER_BUTTON_DISABLED}>← Prev</span>
      )}

      <ol className="order-first basis-full sm:order-none sm:basis-auto flex items-center justify-center gap-1">
        {pageItems(page, lastPage).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="w-5 text-center text-slate-400 font-semibold">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={listPath(basePath, item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={`inline-flex items-center justify-center min-w-8 h-9 px-2 rounded-lg border text-sm font-semibold transition-colors ${FOCUS} ${
                  item === page
                    ? 'bg-primary-light border-primary text-slate-900'
                    : 'bg-white border-border text-slate-600 hover:border-primary hover:text-slate-900'
                }`}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>

      {page < lastPage ? (
        <Link href={listPath(basePath, page + 1)} rel="next" className={`${PAGER_BUTTON} ${FOCUS}`}>
          Next →
        </Link>
      ) : (
        <span aria-disabled="true" className={PAGER_BUTTON_DISABLED}>Next →</span>
      )}
    </nav>
  );
}
