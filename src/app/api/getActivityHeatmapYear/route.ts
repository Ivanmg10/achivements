import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'

const TTL_RECENT = 15 * 60 * 1000
const TTL_OLD = 24 * 60 * 60 * 1000
const CHUNK_DAYS = 30
const TOTAL_DAYS = 365

async function fetchChunk(rausername: string, raid: string, fromTs: number, toTs: number) {
  const url = `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${fromTs}&t=${toTs}`
  return fetch(url).then((r) => r.json()).catch(() => null)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { rausername, raid, id } = session.user

  const now = Math.floor(Date.now() / 1000)
  const cutoff60 = now - 60 * 24 * 3600

  // Build chunk boundaries (newest first)
  const chunks: Array<{ from: number; to: number }> = []
  for (let i = 0; i < TOTAL_DAYS; i += CHUNK_DAYS) {
    const to = now - i * 24 * 3600
    const from = now - Math.min(i + CHUNK_DAYS, TOTAL_DAYS) * 24 * 3600
    chunks.push({ from, to })
  }

  // Fetch each chunk with its own cache key and smart TTL
  const results: unknown[][] = []
  let allValid = true

  for (let batch = 0; batch < chunks.length; batch += 4) {
    const batchChunks = chunks.slice(batch, batch + 4)
    const batchResults = await Promise.all(
      batchChunks.map(({ from, to }) => {
        const chunkKey = `heatmapYear_chunk_v1:${id}:${from}`
        // Old chunks get long TTL; recent chunks get short TTL
        const ttl = to < cutoff60 ? TTL_OLD : TTL_RECENT
        return withCache(
          chunkKey,
          ttl,
          () => fetchChunk(rausername, raid, from, to),
          (d) => Array.isArray(d),
        )
      })
    )
    for (const r of batchResults) {
      if (!Array.isArray(r)) { allValid = false }
      else results.push(r)
    }
  }

  if (!allValid && results.length === 0) {
    return NextResponse.json({ message: 'Failed to fetch' }, { status: 502 })
  }

  const merged = results.flat()
  return NextResponse.json(merged)
}
