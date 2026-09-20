import { NextResponse } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getUserRankAndScore } from '@/lib/raClient'

const TTL = 15 * 60 * 1000

export async function GET() {
  const auth = await requireRaSession()
  if (!auth.ok) return auth.response
  const { id, rausername, raid } = auth.session

  try {
    const data = await withCache(
      `userRankAndScore_v1:${id}`,
      TTL,
      () => getUserRankAndScore(rausername, raid),
      (d) => d !== null && typeof d === 'object' && 'Rank' in d,
    )
    if (!data || typeof data !== 'object' || !('Rank' in data)) {
      return NextResponse.json({ message: 'Invalid RA response' }, { status: 404 })
    }
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
