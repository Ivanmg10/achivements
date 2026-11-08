import { countUpstream } from '@/lib/upstreamCount'

// Two attempts stay under the browser's 20 s, so it never asks again while this still runs.
const TIMEOUT = 8_000
const MAX_ATTEMPTS = 2
const BASE_DELAY = 500
/** Longest we sit on a 429 inside one request; a longer ask is passed up as an error. */
export const MAX_RETRY_AFTER = 5_000

const LABEL = { ra: 'RA', steam: 'Steam' } as const

type Options = {
  platform: keyof typeof LABEL
  /** Waits for this call's turn (RA's pacing); the attempt's deadline already runs while it waits. */
  before?: () => Promise<void>
  /** A 429 waits for its `Retry-After` (up to MAX_RETRY_AFTER) and tries again, instead of failing at once. */
  wait429?: boolean
}

/** `Retry-After` is seconds or an HTTP date; null when absent or unreadable. */
export function retryAfterMs(header: string | null | undefined): number | null {
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

/** How long to wait before the next attempt, or null when this error must be passed up now. */
function nextDelay(e: unknown, attempt: number, wait429: boolean): number | null {
  const { status, retryAfter } = e as { status?: number; retryAfter?: number | null }
  if (status === 429 && wait429) {
    // The header is the only signal: RA's limit is unpublished.
    if ((retryAfter ?? 0) > MAX_RETRY_AFTER) return null
    return retryAfter ?? 1000 * (attempt + 1)
  }
  if (status && status >= 400 && status < 500) return null
  return BASE_DELAY * (attempt + 1)
}

/** The deadline covers the wait for a turn and the answer's headers; the body is read after it. */
async function attemptOnce(url: string, { platform, before }: Options): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  let res: Response
  try {
    await before?.()
    countUpstream(platform)
    res = await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) {
    throw Object.assign(new Error(`${LABEL[platform]} API error ${res.status}`), {
      status: res.status,
      retryAfter: retryAfterMs(res.headers?.get('Retry-After')),
    })
  }
  return res.json()
}

/**
 * A platform API's JSON, with RA's and Steam's shared rules: an 8 s deadline per
 * attempt, two attempts, transient failures (timeouts, network errors, 5xx)
 * retried after a short pause, any non-OK thrown with its `status` so callers
 * answer 503 instead of caching an error, and a 4xx never retried (but a 429
 * with `wait429`).
 */
export async function fetchUpstream(url: string, options: Options): Promise<unknown> {
  let lastErr: unknown
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptOnce(url, options)
    } catch (e) {
      lastErr = e
      const delay = nextDelay(e, attempt, Boolean(options.wait429))
      if (delay === null) throw e
      if (attempt < MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}
