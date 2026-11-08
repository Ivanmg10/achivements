import { fetchUpstream } from '@/lib/upstreamFetch'

export { MAX_RETRY_AFTER } from '@/lib/upstreamFetch'

/** Measured 2026-10-20: one call every 250 ms never failed, a burst of about seven gets a 429. */
const RA_GAP_MS = 250
const RA_BURST = 4
const MAX_KEYS = 5000

const nextSlot = new Map<string, number>()

/**
 * Waits for this key's turn: a short burst at once, then one call per gap. Per
 * instance, like every RA call a person's own page makes.
 */
async function paced(url: string): Promise<void> {
  const key = new URL(url).searchParams.get('y')
  if (!key) return
  if (nextSlot.size > MAX_KEYS) nextSlot.clear()
  const now = Date.now()
  const slot = Math.max(now - RA_BURST * RA_GAP_MS, nextSlot.get(key) ?? 0)
  nextSlot.set(key, slot + RA_GAP_MS)
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now))
}

/**
 * Fetch from the RetroAchievements API (see fetchUpstream), at this key's pace,
 * and a 429 waits for `Retry-After` (up to MAX_RETRY_AFTER) and tries again.
 */
export function fetchRA(url: string): Promise<unknown> {
  return fetchUpstream(url, { platform: 'ra', before: () => paced(url), wait429: true })
}
