/**
 * Request statuses: the values stored in the database and what the website shows for them.
 *
 * Stored values stay as they are: "publish" (every request imported from WordPress), "Initied" (new website requests),
 * "Assigned" and "Finished" (set in the admin). Visitors never see "publish" or the "Initied" spelling: both show as
 * "Initiated", and the status filter's "Initiated" option (value "Initied") also finds the "publish" rows.
 */

export type StatusKey = 'initied' | 'assigned' | 'finished';

const KEYS: Record<string, StatusKey> = {
  initied: 'initied',
  initiated: 'initied',
  publish: 'initied',
  assigned: 'assigned',
  finished: 'finished',
};

const LABELS: Record<StatusKey, string> = {
  initied: 'Initiated',
  assigned: 'Assigned',
  finished: 'Finished',
};

/** The badge style for a stored status (badge-initied, …), or null for an unknown or empty one. */
export function statusKey(status: string | null | undefined): StatusKey | null {
  if (typeof status !== 'string') return null;
  return KEYS[status.trim().toLowerCase()] ?? null;
}

/** What visitors see for a stored status: "Initiated" for publish / Initied / empty, else the status itself. */
export function statusLabel(status: string | null | undefined): string {
  const key = statusKey(status);
  if (key) return LABELS[key];
  const text = typeof status === 'string' ? status.trim() : '';
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : LABELS.initied;
}

/** Options of the status filter on /requests: the stored value the API filters by, and its label. */
export const STATUS_FILTERS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'Initied', label: 'Initiated' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Finished', label: 'Finished' },
];

/** Months without activity after which a request is archived (the backend's default; it decides). */
export const ARCHIVE_MONTHS = 6;

export const ARCHIVED_LABEL = 'Archived';

/** Shown instead of the quote form on an archived request (the same words the API answers with). */
export const ARCHIVED_NOTE = `This request is archived because it has had no activity for ${ARCHIVE_MONTHS} months, so it no longer takes quotes.`;
