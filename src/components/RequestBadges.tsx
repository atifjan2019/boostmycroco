import { ARCHIVED_LABEL, statusKey, statusLabel } from '@/lib/request-status';

/** The request types that have their own badge colours (badge-free, badge-quote, badge-offer). */
const TYPE_KEYS = new Set(['free', 'quote', 'offer']);

/** Status badge with the visitor-facing label ("publish" and "Initied" show as "Initiated"). */
export function StatusBadge({ status }: { status: string | null | undefined }) {
  return <span className={`badge badge-${statusKey(status) ?? 'other'}`}>{statusLabel(status)}</span>;
}

/** Type badge (Free / Quote / Offer); nothing when the request has no type. */
export function TypeBadge({ type }: { type: string | null | undefined }) {
  const label = typeof type === 'string' ? type.trim() : '';
  if (!label) return null;
  const key = label.toLowerCase();
  return <span className={`badge badge-${TYPE_KEYS.has(key) ? key : 'other'}`}>{label}</span>;
}

export function ArchivedBadge() {
  return <span className="badge badge-archived">{ARCHIVED_LABEL}</span>;
}
