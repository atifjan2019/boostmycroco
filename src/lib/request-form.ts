/**
 * Shared by the two "new request" forms (/make-a-request and /dashboard/requests/new) so both send the same
 * values. The types are the ones the backend accepts, the admin offers and the existing requests use.
 */

export const REQUEST_TYPES = ['Free', 'Quote', 'Offer'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_HINTS: Record<RequestType, string> = {
  Free: 'Community help',
  Quote: 'Paid project',
  Offer: 'Service offer',
};

export const REQUEST_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic', 'Hindi'];

/** Fields of the request forms that the backend validates and that have an input on screen. */
export const REQUEST_FIELDS = ['title', 'description', 'type', 'language', 'budget'];

/** Largest budget/price the database column holds (decimal 8,2). */
export const MAX_AMOUNT = 999999;

export interface RequestFormValues {
  title: string;
  description: string;
  type: string;
  language: string;
  budget: string;
}

interface MemberLike {
  email?: string | null;
  client_profile?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    country?: string | null;
    email_contact?: string | null;
  } | null;
}

/** Both request forms ask for these profile fields before a member can post (the API does not check this). */
export function isProfileComplete(user: MemberLike | null | undefined): boolean {
  const p = user?.client_profile;
  return !!(p?.first_name && p?.last_name && p?.phone && p?.country && (p?.email_contact || user?.email));
}

/** JSON body for POST /api/requests. A free request has no budget. */
export function requestPayload(form: RequestFormValues) {
  const budget = form.type === 'Free' ? 0 : parseFloat(form.budget);
  return {
    title: form.title.trim(),
    description: form.description,
    type: form.type,
    language: form.language,
    budget: Number.isFinite(budget) ? budget : 0,
  };
}
