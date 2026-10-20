/**
 * Turns a failed API response into messages a form can show: one per input (Laravel 422 "errors"), one for the
 * Turnstile box, and one general message. Server errors (5xx) and anything that looks like a stack trace or a
 * database error never reach the page: the form's own fallback text is shown instead.
 */

/** Form field name → first message for it. */
export type FieldErrors = Record<string, string>;

export interface FormFailure {
  /** Messages for inputs on this form, keyed by the form's own field names. */
  fields: FieldErrors;
  /** Message for the Turnstile check (backend field turnstile_token), if the server rejected it. */
  turnstile: string;
  /** Message for the whole form: problems with no input on screen, or with the request as a whole. */
  message: string;
}

export interface FailureOptions {
  /** Field names that have an input on screen. */
  fields: string[];
  /** Backend field name → form field name, where they differ (e.g. password_confirmation → confirm). */
  aliases?: Record<string, string>;
  /** Shown for server errors and anything we cannot show safely. */
  fallback: string;
  /** Shown for 401 (signed out / token no longer valid). */
  unauthorized?: string;
}

/** Shown when fetch() itself throws (offline, DNS, CORS, server unreachable). */
export const NETWORK_ERROR = 'Could not reach the server. Please check your connection and try again.';

const TOO_MANY = 'Too many attempts. Please wait a minute and try again.';

// Text that suggests internals (SQL, PHP, framework classes): never shown to visitors.
const UNSAFE_TEXT =
  /SQLSTATE|exception|stack trace|vendor\/|\\App\\|Illuminate|\.php\b|fillable|mass assignment|syntax error|undefined (index|variable|array key|method|offset)|call to (a )?(member|undefined)|Server Error/i;

// Messages about the bot check that come back without a field name (the API calls it the "'I am human' check").
const TURNSTILE_TEXT = /turnstile|captcha|i am human|human verification|verification (failed|expired|required)|complete the verification/i;

const TURNSTILE_KEYS = new Set(['turnstile_token', 'cf-turnstile-response', 'turnstile']);

/** The text if it is short, plain and free of internals; otherwise ''. */
export function safeMessage(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || text.length > 300 || UNSAFE_TEXT.test(text)) return '';
  return text;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await res.json();
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function readFailure(res: Response, options: FailureOptions): Promise<FormFailure> {
  const result: FormFailure = { fields: {}, turnstile: '', message: '' };

  if (res.status === 429) {
    // The API's own wording ("Too many sign-in attempts…") when it sent one, else ours.
    const body = await readJson(res);
    result.message = safeMessage(body.message) || TOO_MANY;
    return result;
  }
  if (res.status === 401 && options.unauthorized) {
    result.message = options.unauthorized;
    return result;
  }
  if (res.status === 503) {
    // The API answers 503 when it cannot reach Cloudflare for the bot check ("…wait a minute and try again"): that
    // message helps the visitor. Any other 503 (maintenance, overload) gets the form's own text.
    const body = await readJson(res);
    const text = safeMessage(body.message);
    result.message = text && TURNSTILE_TEXT.test(text) ? text : options.fallback;
    return result;
  }
  if (res.status < 400 || res.status >= 500) {
    result.message = options.fallback;
    return result;
  }

  const body = await readJson(res);
  const general: string[] = [];

  const errors = body.errors;
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
      const text = safeMessage(Array.isArray(value) ? value[0] : value);
      if (!text) continue;
      if (TURNSTILE_KEYS.has(key)) {
        result.turnstile ||= text;
        continue;
      }
      const field = options.aliases?.[key] ?? key;
      if (options.fields.includes(field)) {
        if (!result.fields[field]) result.fields[field] = text;
      } else if (!general.includes(text)) {
        general.push(text);
      }
    }
  }

  if (general.length) result.message = general.join(' ');

  if (!result.message && !result.turnstile && Object.keys(result.fields).length === 0) {
    const text = safeMessage(body.message) || safeMessage(body.error);
    if (text && TURNSTILE_TEXT.test(text)) result.turnstile = text;
    else result.message = text || options.fallback;
  }

  return result;
}

/**
 * The message for the top of the form: the failure's own message plus a rejected bot check. The bot check's
 * message goes here rather than under the widget because the widget clears its own message as soon as it has
 * a fresh token, which can be immediately.
 */
export function generalMessage(failure: FormFailure): string {
  return [failure.message, failure.turnstile].filter(Boolean).join(' ');
}

/** Moves focus to the first input that has an error (inputs use id `${prefix}-${field}`). */
export function focusFirstError(fields: FieldErrors, order: string[], prefix: string) {
  const first = order.find(f => fields[f]);
  if (!first || typeof window === 'undefined') return;
  // After React has committed the messages; a timer (not requestAnimationFrame) also runs in background tabs.
  window.setTimeout(() => document.getElementById(`${prefix}-${first}`)?.focus(), 0);
}
