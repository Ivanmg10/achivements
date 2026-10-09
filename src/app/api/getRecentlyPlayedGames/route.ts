import { NextResponse } from 'next/server'
import { dataOwner } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getUserRecentlyPlayedGames } from '@/lib/raClient'

const TTL = 5 * 60 * 1000

export async function GET(req?: Request) {
  const owner = await dataOwner(req)
  if (!owner) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { rausername, raid, id } = owner
  if (!rausername || !raid) {
    return NextResponse.json([])
  }

  try {
    const data = await withCache(
      `recentlyPlayed:${id}`,
      TTL,
      () => getUserRecentlyPlayedGames(rausername, raid, 500),
      (d) => Array.isArray(d),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
