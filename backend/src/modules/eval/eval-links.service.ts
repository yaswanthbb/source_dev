import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
function publicAddress(address: string): boolean {
  if (isIP(address) === 6) return /^[23][\da-f]{3}:/i.test(address); // Global-unicast only, never mapped IPv4.
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split('.').map(Number);
  return (
    a > 0 &&
    a < 224 &&
    ![10, 127].includes(a) &&
    !(a === 169 && b === 254) &&
    !(a === 172 && b >= 16 && b <= 31) &&
    !(a === 192 && [0, 168].includes(b)) &&
    !(a === 100 && b >= 64 && b <= 127) &&
    !(a === 198 && [18, 19, 51].includes(b)) &&
    !(a === 203 && b === 0)
  );
}
/** Network observations happen BEFORE Layer 1; its replay uses only the stored boolean snapshot.
 * Opt-in exact trusted hosts only, no arbitrary URLs, credentials, IP literals or automatic redirects. */
@Injectable()
export class EvalLinksService {
  constructor(private readonly config: ConfigService) {}
  async snapshot(content: string): Promise<Record<string, boolean>> {
    const allowed = new Set(
      (this.config.get<string>('EVAL_LINK_ALLOWED_HOSTS') ?? '')
        .split(',')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean),
    );
    const urls = [
      ...new Set(
        [...content.matchAll(/\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/g)].map(
          (m) => m[1],
        ),
      ),
    ];
    const permitted = (value: string) => {
      try {
        const u = new URL(value);
        return (
          ['http:', 'https:'].includes(u.protocol) &&
          !u.username &&
          !u.password &&
          !u.port &&
          !isIP(u.hostname.replace(/^\[|\]$/g, '')) &&
          allowed.has(u.hostname.toLowerCase()) &&
          !['localhost', 'localhost.localdomain'].includes(
            u.hostname.toLowerCase(),
          ) &&
          !u.hostname.endsWith('.local') &&
          value.length <= 2000
        );
      } catch {
        return false;
      }
    };
    const probe = async (url: string): Promise<boolean> => {
      if (!permitted(url)) return false;
      try {
        const addresses = await lookup(new URL(url).hostname, { all: true });
        if (
          !addresses.length ||
          addresses.some((entry) => !publicAddress(entry.address))
        )
          return false;
        let response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(5000),
        });
        if ([400, 405, 501].includes(response.status))
          response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(5000),
          });
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          return !!location && permitted(new URL(location, url).href);
        }
        return response.ok || [401, 403, 429].includes(response.status);
      } catch {
        return false;
      }
    };
    const result: Record<string, boolean> = Object.fromEntries(
      urls.map((url) => [url, false]),
    );
    // Four at a time, twenty per artifact. Unchecked remainder deliberately stays false.
    for (let i = 0; i < Math.min(urls.length, 20); i += 4)
      await Promise.all(
        urls.slice(i, Math.min(i + 4, 20)).map(async (url) => {
          result[url] = await probe(url);
        }),
      );
    return result;
  }
}
