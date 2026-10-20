import { request } from 'node:https';

/**
 * Server-side only. One log line when the API refuses or fails a request, so the hosting logs show who answered
 * (for example the server firewall's "bot check" page, which never reaches the Laravel logs) and which public IP this
 * server called from. Runs only after a request has already failed, and never throws.
 */
export async function logUpstreamFailure(what: string, url: string, res: Response): Promise<void> {
  let body = '';
  try {
    body = (await res.text()).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  } catch {
    // body already read or unreadable: the status alone still helps
  }
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    // keep the raw value
  }
  const ip = await publicIp();
  console.error(
    `[api] ${what}: HTTP ${res.status} from ${host} (server header: ${res.headers.get('server') ?? '-'}), ` +
      `this server's IP: ${ip}, answer: ${body || '(empty)'}`,
  );
}

/**
 * This server's public IP from api.ipify.org, through node:https so it bypasses the Next.js fetch cache and never
 * changes how the page is rendered. 'unknown' after 3 seconds or on any error.
 */
function publicIp(): Promise<string> {
  return new Promise((resolve) => {
    const req = request('https://api.ipify.org', { timeout: 3000 }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        if (data.length < 64) data += chunk;
      });
      res.on('end', () => {
        const ip = data.trim();
        resolve(/^[0-9a-f.:]{3,45}$/i.test(ip) ? ip : 'unknown');
      });
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve('unknown'));
    req.end();
  });
}
