import { NextResponse } from 'next/server'
import { dataOwner } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getUserCompletedGames } from '@/lib/raClient'

const TTL = 10 * 60 * 1000

export async function GET(req?: Request) {
  const owner = await dataOwner(req)
  if (!owner) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { rausername, raid, id } = owner
  if (!rausername || !raid) {
    return NextResponse.json([], { status: 200 })
  }

  try {
    const data = await withCache(
      `gamesCompleted:${id}`,
      TTL,
      () => getUserCompletedGames(rausername, raid),
      (d) => Array.isArray(d),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
