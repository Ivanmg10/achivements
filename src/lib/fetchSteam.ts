const STEAM_TIMEOUT = 12_000
const MAX_ATTEMPTS = 3
const BASE_DELAY = 500

export const STEAM_API_BASE = 'https://api.steampowered.com'

/**
 * Fetch from the Steam Web API. Mirrors fetchRA: retries transient failures
 * (timeouts, network errors, 5xx) and throws on non-OK so callers can return
 * 503 instead of caching an error payload. 4xx is not retried.
 *
 * Steam is stricter than RA about rate limits (~100-200 calls / 5 min), so a
 * 429 is surfaced immediately rather than retried into the limit.
 */
export async function fetchSteam(url: string): Promise<unknown> {
  let lastErr: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), STEAM_TIMEOUT)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) {
        throw Object.assign(new Error(`Steam API error ${res.status}`), { status: res.status })
      }
      return await res.json()
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      const status = (e as { status?: number }).status
      if (status && status >= 400 && status < 500) throw e
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

/** Reads the server-wide Steam Web API key. One key for the whole app, not per user. */
export function steamApiKey(): string | null {
  return process.env.STEAM_API_KEY?.trim() || null
}
