const RA_TIMEOUT = 12_000
const MAX_ATTEMPTS = 3
const BASE_DELAY = 500

/**
 * Fetch from the RetroAchievements API with proper error propagation and
 * retry on transient failures (timeouts, network errors, 5xx). Throws on any
 * non-OK HTTP response so callers can propagate 503 to clients and avoid
 * caching empty/error data. 4xx responses are not retried — they indicate a
 * bad request, not a transient RA hiccup.
 */
export async function fetchRA(url: string): Promise<unknown> {
  let lastErr: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), RA_TIMEOUT)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) {
        throw Object.assign(new Error(`RA API error ${res.status}`), { status: res.status })
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
