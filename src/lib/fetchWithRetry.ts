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
