import { raUnavailable } from '@/lib/raFailure'
import { NextResponse } from 'next/server'
import { dataOwner } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getUserRecentlyPlayedGames } from '@/lib/raClient'
import { visibleGamesForUser } from '@/lib/gameVisibility'
import type { RecentlyPlayedGame } from '@/types/types'

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
    const data = await withCache<RecentlyPlayedGame[]>(
      `recentlyPlayed:${id}`,
      TTL,
      async () => (await getUserRecentlyPlayedGames(rausername, raid, 500)) as RecentlyPlayedGame[],
      (d) => Array.isArray(d),
    )
    const visible = await visibleGamesForUser(id, data, 'ra', (game) => game.GameID)
    return cachedJson(visible, 0)
  } catch (err) {
    return raUnavailable(err)
  }
}
