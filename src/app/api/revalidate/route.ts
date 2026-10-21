import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';

/**
 * On-demand refresh, called by the backend (App\Support\SiteRevalidator) after a request, a quote or a tip is created,
 * changed, published, unpublished or deleted, so the affected pages (and /sitemap.xml) show it without waiting for
 * their time-based refresh.
 *
 * POST with the header x-revalidate-secret (the value saved as REVALIDATE_SECRET in the hosting settings, and in
 * Admin > Settings > Website refresh) and the JSON body {"paths": ["/requests/<slug>", "/requests", …]}: at most 20
 * site paths. Each path is marked stale and rebuilt on its next visit.
 *
 * 503 when REVALIDATE_SECRET is not set (the feature is off), 401 for a missing or wrong secret, 400 for a bad body.
 * The secret is never logged or sent back.
 */

export const dynamic = 'force-dynamic';

const MAX_PATHS = 20;
const MAX_BODY_BYTES = 16 * 1024;
/** A site path: starts with one "/", then letters, digits and - _ . / only (no query, no "..", no "//"). */
const SAFE_PATH = /^\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*(?:\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*)?$/;

function sameSecret(given: string, expected: string): boolean {
  // Hashing first gives both sides the same length, so the comparison time says nothing about the secret.
  const a = createHash('sha256').update(given, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}

function answer(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  // Trimmed like the backend trims the pasted copy, so a space or line break pasted into the hosting settings does
  // not make every call fail.
  const secret = (process.env.REVALIDATE_SECRET ?? '').trim();
  if (secret === '') return answer(503, { message: 'On-demand refresh is not set up on this site.' });

  const given = (request.headers.get('x-revalidate-secret') ?? '').trim();
  if (given === '' || !sameSecret(given, secret)) return answer(401, { message: 'Unauthorized.' });

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return answer(400, { message: 'The body could not be read.' });
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return answer(400, { message: 'The body is too large.' });

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return answer(400, { message: 'The body must be JSON: {"paths": ["/…"]}.' });
  }
  const paths = data && typeof data === 'object' && !Array.isArray(data) ? (data as { paths?: unknown }).paths : undefined;
  if (!Array.isArray(paths) || paths.length === 0) return answer(400, { message: 'paths must be a list of site paths.' });
  if (paths.length > MAX_PATHS) return answer(400, { message: `At most ${MAX_PATHS} paths per call.` });

  const unique = [...new Set(paths)];
  const bad = unique.filter((p) => typeof p !== 'string' || p.length > 512 || !SAFE_PATH.test(p) || p.includes('..'));
  if (bad.length > 0) return answer(400, { message: 'Every path must be a site path such as "/requests/my-request-12".' });

  for (const path of unique as string[]) revalidatePath(path);
  return answer(200, { revalidated: unique, now: Date.now() });
}
