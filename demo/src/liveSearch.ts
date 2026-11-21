import type { School, SearchSchools } from '@skolo-saka/school-search';

// The demo's connection to the live Skolo Saka school directory. The package itself knows nothing
// about Skolo Saka's backend: any app passes its own searchSchools. This one calls the website's
// public API, GET <origin>/api/public/schools/search?q=, which returns real schools with only
// public fields (id, name, town, municipality, province, level, verified).

/** Where the website and its API live. Set VITE_SKOLO_SAKA_ORIGIN for UAT or a local website. */
export const SKOLO_SAKA_ORIGIN = (import.meta.env.VITE_SKOLO_SAKA_ORIGIN || 'https://www.skolosaka.co.za').replace(/\/+$/, '');

/**
 * Where the API is called. A built demo calls the website directly (the API allows the GitHub Pages
 * origin). `npm run demo` calls its own dev server, which proxies /api/public to SKOLO_SAKA_ORIGIN
 * (demo/vite.config.ts), so local development needs no CORS exception.
 */
export const API_ORIGIN = import.meta.env.DEV ? '' : SKOLO_SAKA_ORIGIN;

export const schoolPageUrl = (id: string, origin = SKOLO_SAKA_ORIGIN) => `${origin}/school/${encodeURIComponent(id)}`;
export const directorySearchUrl = (query: string, origin = SKOLO_SAKA_ORIGIN) => `${origin}/schools?q=${encodeURIComponent(query)}`;
export const searchApiUrl = (query: string, origin = SKOLO_SAKA_ORIGIN) => `${origin}/api/public/schools/search?q=${encodeURIComponent(query)}`;

const optionalText = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null);

/** One school from the API, or null when the record is not usable. Unknown fields are dropped. */
export function toSchool(value: unknown): School | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !v.id.trim() || typeof v.name !== 'string' || !v.name.trim()) return null;
  return {
    id: v.id, name: v.name,
    town: optionalText(v.town), municipality: optionalText(v.municipality), province: optionalText(v.province),
    level: optionalText(v.level), verified: v.verified === true,
  };
}

/**
 * Checks an API answer. A body without a `schools` array is an error (shown with "Try again"), never
 * an empty result; individual malformed schools are skipped.
 */
export function parseSearchResponse(body: unknown): School[] {
  const schools = body && typeof body === 'object' ? (body as { schools?: unknown }).schools : undefined;
  if (!Array.isArray(schools)) throw new Error('The school directory sent an unexpected answer.');
  return schools.map(toSchool).filter((s): s is School => s !== null);
}

/**
 * searchSchools for the live directory. The component's AbortSignal cancels the request when a newer
 * search replaces it. Any failure throws, so the component shows its error and "Try again"; there is
 * never a fallback to fictional schools.
 */
export function liveSearch({ origin = API_ORIGIN, fetchImpl = (...args: Parameters<typeof fetch>) => fetch(...args) }: { origin?: string; fetchImpl?: typeof fetch } = {}): SearchSchools {
  return async (query, { signal }) => {
    const response = await fetchImpl(searchApiUrl(query, origin), { signal, headers: { Accept: 'application/json' }, credentials: 'omit' });
    let body: unknown = null;
    try { body = await response.json(); } catch { /* handled below */ }
    if (!response.ok) {
      const message = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : `HTTP ${response.status}`;
      throw new Error(message);
    }
    return parseSearchResponse(body);
  };
}
