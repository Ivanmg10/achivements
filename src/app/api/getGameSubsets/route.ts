import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { raUnavailable } from '@/lib/raFailure'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getGameList } from '@/lib/raClient'

const TTL = 60 * 60 * 1000

type GameListEntry = { ID: number; Title: string; NumAchievements: number; ImageIcon: string }

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession()
    if (!auth.ok) return auth.response

    const gameId = request.nextUrl.searchParams.get('gameId')
    const consoleId = request.nextUrl.searchParams.get('consoleId')
    const baseTitle = request.nextUrl.searchParams.get('baseTitle')

    if (!gameId || !consoleId || !baseTitle) {
      return NextResponse.json({ message: 'Missing params' }, { status: 400 })
    }

    const { raid } = auth.user
    if (!raid) return NextResponse.json([], { status: 200 })

    const raw = await withCache(
      `gameList_v1:${consoleId}`,
      TTL,
      () => getGameList(consoleId, raid),
      (d) => Array.isArray(d),
    )

    if (!Array.isArray(raw)) throw new Error('RA game list is not a list')

    const list = raw as GameListEntry[]
    const subsets = list.filter((g) => {
      if (g.ID === Number(gameId)) return false
      if (!g.Title?.includes('[Subset -')) return false
      return g.Title.startsWith(baseTitle + ' [') || g.Title.startsWith(baseTitle + ' |')
    })

    return cachedJson(subsets, TTL, { sameForEveryone: true })
  } catch (err) {
    // Not an empty list: a failed lookup is not a game without subsets. The page costs only its tabs.
    console.error('[getGameSubsets]', err)
    return raUnavailable(err)
  }
}
