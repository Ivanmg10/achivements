import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

const TTL_RECENT = 15 * 60 * 1000
const TTL_OLD = 24 * 60 * 60 * 1000
const CHUNK_DAYS = 30
const TOTAL_DAYS = 365

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { rausername, raid, id } = session.user
  if (!rausername || !raid) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

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
        () => fetchRA(
          `https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=${rausername}&y=${raid}&f=${from}&t=${to}`,
        ),
        (d) => Array.isArray(d),
      ).catch(() => [] as unknown[])
    )
  )

  const merged = settled.flat()
  return NextResponse.json(merged)
}
