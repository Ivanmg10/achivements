const BASE_DELAY = 800

export async function fetchWithRetry(
  url: string,
  maxAttempts = 3,
): Promise<unknown> {
  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url)
      // 4xx = client error, throw immediately without retry
      if (res.status >= 400 && res.status < 500) {
        throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status })
      }
      // 5xx = server error, let the loop retry — but first throw to hit the catch
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // Parse JSON inside the loop so empty/truncated bodies also get retried
      return await res.json()
    } catch (e) {
      lastErr = e
      const status = (e as { status?: number }).status
      if (status && status >= 400 && status < 500) throw e // never retry 4xx
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * (attempt + 1)))
      }
    }
  }
  throw lastErr
}
