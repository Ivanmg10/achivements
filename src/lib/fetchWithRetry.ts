const BASE_DELAY = 800

export async function fetchWithRetry(
  url: string,
  maxAttempts = 3,
): Promise<Response> {
  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url)
      // 4xx = client error, no point retrying
      if (res.ok || res.status < 500) return res
      throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastErr = e
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * (attempt + 1)))
      }
    }
  }
  throw lastErr
}
