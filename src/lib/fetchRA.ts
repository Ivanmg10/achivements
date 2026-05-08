const RA_TIMEOUT = 12_000

/**
 * Fetch from the RetroAchievements API with proper error propagation.
 * Throws on any non-OK HTTP response so callers can propagate 503 to clients
 * and avoid caching empty/error data.
 */
export async function fetchRA(url: string): Promise<unknown> {
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
    throw e
  }
}
