import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'

const TTL_RECENT = 15 * 60 * 1000
const TTL_OLD = 24 * 60 * 60 * 1000
const CHUNK_DAYS = 30
const TOTAL_DAYS = 365

async function fetchChunk(username: string, apiKey: string, fromTs: number, toTs: number) {
  const url = `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${encodeURIComponent(username)}&y=${apiKey}&f=${fromTs}&t=${toTs}`
  return fetch(url).then((r) => r.json()).catch(() => null)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

  const apiKey = session.user.raid ?? process.env.RA_API_KEY ?? null
  if (!apiKey) return NextResponse.json({ message: 'No RA API key configured' }, { status: 503 })

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
          () => fetchChunk(username, apiKey, from, to),
          (d) => Array.isArray(d),
        )
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

  return NextResponse.json(results.flat())
}
