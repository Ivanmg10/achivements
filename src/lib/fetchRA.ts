const RA_TIMEOUT = 12_000
const MAX_ATTEMPTS = 3
const BASE_DELAY = 500
/** Longest we sit on a 429 inside one request; a longer ask is passed up as an error. */
export const MAX_RETRY_AFTER = 5_000

/** `Retry-After` is seconds or an HTTP date; null when absent or unreadable. */
function retryAfterMs(header: string | null | undefined): number | null {
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

/**
 * Fetch from the RetroAchievements API with proper error propagation and
 * retry on transient failures (timeouts, network errors, 5xx). Throws on any
 * non-OK HTTP response so callers can propagate 503 to clients and avoid
 * caching empty/error data. 4xx responses are not retried — they indicate a
 * bad request, not a transient RA hiccup — except 429, which waits for
 * `Retry-After` (up to MAX_RETRY_AFTER) and tries again.
 */
export async function fetchRA(url: string): Promise<unknown> {
  let lastErr: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), RA_TIMEOUT)
    let delay = BASE_DELAY * (attempt + 1)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) {
        throw Object.assign(new Error(`RA API error ${res.status}`), {
          status: res.status,
          retryAfter: retryAfterMs(res.headers?.get('Retry-After')),
        })
      }
      return await res.json()
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      const { status, retryAfter } = e as { status?: number; retryAfter?: number | null }
      if (status === 429) {
        // RA's limit is unpublished, so the header is the only signal we get.
        if ((retryAfter ?? 0) > MAX_RETRY_AFTER) throw e
        delay = retryAfter ?? 1000 * (attempt + 1)
      } else if (status && status >= 400 && status < 500) throw e
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastErr
}
