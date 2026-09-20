import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { getAchievementsEarnedBetween } from '@/lib/raClient'

const TTL_RECENT = 15 * 60 * 1000
const TTL_OLD = 24 * 60 * 60 * 1000
const CHUNK_DAYS = 30
const TOTAL_DAYS = 365

export async function GET(req: NextRequest) {
  const auth = await requireViewerApiKey()
  if (!auth.ok) return auth.response
  const { apiKey } = auth

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

  const now = Math.floor(Date.now() / 1000)
  const cutoff60 = now - 60 * 24 * 3600

  const chunks: Array<{ from: number; to: number }> = []
  for (let i = 0; i < TOTAL_DAYS; i += CHUNK_DAYS) {
    const to = now - i * 24 * 3600
    const from = now - Math.min(i + CHUNK_DAYS, TOTAL_DAYS) * 24 * 3600
    chunks.push({ from, to })
  }

  const results: unknown[][] = []
  let allValid = true

  for (let batch = 0; batch < chunks.length; batch += 4) {
    const batchChunks = chunks.slice(batch, batch + 4)
    const batchResults = await Promise.all(
      batchChunks.map(({ from, to }) => {
        const chunkKey = `publicHeatmapYear:${username.toLowerCase()}:${from}`
        const ttl = to < cutoff60 ? TTL_OLD : TTL_RECENT
        return withCache(
          chunkKey,
          ttl,
          () => getAchievementsEarnedBetween(username, apiKey, from, to),
          (d) => Array.isArray(d),
        ).catch(() => null)
      }),
    )
    for (const r of batchResults) {
      if (!Array.isArray(r)) { allValid = false }
      else results.push(r)
    }
  }

  if (!allValid && results.length === 0) {
    return NextResponse.json({ message: 'Failed to fetch' }, { status: 502 })
  }

  return cachedJson(results.flat(), TTL_RECENT)
}
