const BASE_DELAY = 800
const TIMEOUT_MS = 20_000
const MAX_ATTEMPTS = 4

export async function fetchWithRetry(
  url: string,
  maxAttempts = MAX_ATTEMPTS,
): Promise<unknown> {
  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (res.status >= 400 && res.status < 500) {
        throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      const status = (e as { status?: number }).status
      if (status && status >= 400 && status < 500) throw e
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

const MAX_BACKGROUND_RETRIES = 5

/**
 * The slow retry loop the data hooks run after fetchWithRetry gives up: 3 s,
 * 6 s, 12 s… capped at 30 s. Returns false when it is time to stop and show
 * the error instead — after MAX_BACKGROUND_RETRIES, or at once on a 4xx,
 * which asking again will not fix. Before this cap a failing endpoint left
 * its section loading forever.
 */
export function scheduleRetry(
  attempt: { current: number },
  timer: { current: ReturnType<typeof setTimeout> | undefined },
  retry: () => void,
  err?: unknown,
): boolean {
  const status = (err as { status?: number } | undefined)?.status
  if (status && status >= 400 && status < 500) return false
  if (attempt.current >= MAX_BACKGROUND_RETRIES) return false
  const delay = Math.min(3_000 * 2 ** attempt.current, 30_000)
  attempt.current++
  timer.current = setTimeout(retry, delay)
  return true
}
