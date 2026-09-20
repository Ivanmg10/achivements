import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getAchievementsEarnedBetween } from '@/lib/raClient'

const TTL_RECENT = 15 * 60 * 1000
const TTL_OLD = 24 * 60 * 60 * 1000
const CHUNK_DAYS = 30
const TOTAL_DAYS = 365

export async function GET() {
  const auth = await requireRaSession()
  if (!auth.ok) return auth.response
  const { id, rausername, raid } = auth.session

  const now = Math.floor(Date.now() / 1000)
  const cutoff60 = now - 60 * 24 * 3600

  const chunks: Array<{ from: number; to: number }> = []
  for (let i = 0; i < TOTAL_DAYS; i += CHUNK_DAYS) {
    const to = now - i * 24 * 3600
    const from = now - Math.min(i + CHUNK_DAYS, TOTAL_DAYS) * 24 * 3600
    chunks.push({ from, to })
  }

  const settled = await Promise.all(
    chunks.map(({ from, to }) =>
      withCache(
        `heatmapYear_chunk_v2:${id}:${from}`,
        to < cutoff60 ? TTL_OLD : TTL_RECENT,
        () => getAchievementsEarnedBetween(rausername, raid, from, to),
        (d) => Array.isArray(d),
      ).catch(() => [] as unknown[])
    )
  )

  const merged = settled.flat()
  // Use the shorter of the two chunk TTLs for the response header — the
  // recent-day chunks refresh more often than the response should ever be
  // treated as fresh by the browser.
  return cachedJson(merged, TTL_RECENT)
}
