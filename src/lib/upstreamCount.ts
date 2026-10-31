/**
 * How many calls went to each platform today, across instances. Kept in
 * steam_cache and flushed in batches, so counting costs one write per
 * FLUSH_EVERY calls and never holds up the call itself.
 * ponytail: what an instance has not flushed when it stops is lost, at most
 * FLUSH_EVERY calls each; it is a brake and a gauge, not an invoice.
 */
const FLUSH_EVERY = 50
const STEAM_DAILY_CAP = 100_000
const WARN_AT = 0.7
const STOP_FILLS_AT = 0.85
const READ_EVERY_MS = 60_000

export type UpstreamPlatform = 'ra' | 'steam' | 'psn'

const pending: Record<UpstreamPlatform, number> = { ra: 0, steam: 0, psn: 0 }
let steamToday = { value: 0, at: 0, warned: false }

const keyFor = (platform: UpstreamPlatform, now = new Date()) => `upstream:${platform}:${now.toISOString().slice(0, 10)}`

async function flush(platform: UpstreamPlatform, calls: number): Promise<void> {
  try {
    const { default: pool } = await import('@/lib/db')
    await pool.query(
      `INSERT INTO steam_cache (cache_key, cache_data, expires_at)
       VALUES ($1, jsonb_build_object('calls', $2::int), NOW() + INTERVAL '3 days')
       ON CONFLICT (cache_key) DO UPDATE
       SET cache_data = jsonb_build_object('calls', (steam_cache.cache_data->>'calls')::int + $2::int)`,
      [keyFor(platform), calls],
    )
  } catch (err) {
    console.error('[upstreamCount] flush', platform, err)
  }
}

/** One call to a platform. Fire and forget. */
export function countUpstream(platform: UpstreamPlatform): void {
  pending[platform]++
  if (pending[platform] < FLUSH_EVERY) return
  const calls = pending[platform]
  pending[platform] = 0
  void flush(platform, calls)
}

/** Calls counted today, or 0 when the count cannot be read. */
export async function upstreamCalls(platform: UpstreamPlatform): Promise<number> {
  try {
    const { default: pool } = await import('@/lib/db')
    const { rows } = await pool.query("SELECT (cache_data->>'calls')::int AS calls FROM steam_cache WHERE cache_key = $1", [keyFor(platform)])
    return rows[0]?.calls ?? 0
  } catch (err) {
    console.error('[upstreamCount] read', platform, err)
    return 0
  }
}

/**
 * Whether Steam's daily cap is close enough that fills should wait, so that
 * browsing keeps working. The one key is everyone's. Warns once in the logs at 70 %.
 */
export async function steamBudgetLow(now = Date.now()): Promise<boolean> {
  if (now - steamToday.at > READ_EVERY_MS) steamToday = { ...steamToday, value: await upstreamCalls('steam'), at: now }
  if (steamToday.value >= STEAM_DAILY_CAP * WARN_AT && !steamToday.warned) {
    steamToday.warned = true
    console.warn('[upstreamCount] Steam calls today', steamToday.value, 'of', STEAM_DAILY_CAP)
  }
  return steamToday.value >= STEAM_DAILY_CAP * STOP_FILLS_AT
}
