import { raUnavailable } from '@/lib/raFailure'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getUserWantToPlayList } from '@/lib/raClient'
import { visibleGamesForUser } from '@/lib/gameVisibility'
import type { WantToPlayGame } from '@/types/types'

type WantToPlayResponse = { Count: number; Total?: number; Results: WantToPlayGame[] }

const TTL = 15 * 60 * 1000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { rausername, raid, id } = session.user
  if (!rausername || !raid) {
    return NextResponse.json({ Count: 0, Total: 0, Results: [] })
  }

  try {
    const data = await withCache<WantToPlayResponse>(
      `wantToPlay:${id}`,
      TTL,
      async () => (await getUserWantToPlayList(rausername, raid)) as WantToPlayResponse,
      (d) => d !== null && typeof d === 'object' && 'Results' in d && Array.isArray((d as { Results: unknown }).Results),
    )
    const results = await visibleGamesForUser(id, data.Results, 'ra', (game) => game.ID ?? game.GameID!)
    return cachedJson({ ...data, Count: results.length, Total: results.length, Results: results }, 0)
  } catch (err) {
    return raUnavailable(err)
  }
}
