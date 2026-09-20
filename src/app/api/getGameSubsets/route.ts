import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getGameList } from '@/lib/raClient'

const TTL = 60 * 60 * 1000

type GameListEntry = { ID: number; Title: string; NumAchievements: number; ImageIcon: string }

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

    const gameId = request.nextUrl.searchParams.get('gameId')
    const consoleId = request.nextUrl.searchParams.get('consoleId')
    const baseTitle = request.nextUrl.searchParams.get('baseTitle')

    if (!gameId || !consoleId || !baseTitle) {
      return NextResponse.json({ message: 'Missing params' }, { status: 400 })
    }

    const { raid } = session.user
    if (!raid) return NextResponse.json([], { status: 200 })

    const raw = await withCache(
      `gameList_v1:${consoleId}`,
      TTL,
      () => getGameList(consoleId, raid),
      (d) => Array.isArray(d) && d.length > 0,
    )

    if (!Array.isArray(raw)) return NextResponse.json([], { status: 200 })

    const list = raw as GameListEntry[]
    const subsets = list.filter((g) => {
      if (g.ID === Number(gameId)) return false
      if (!g.Title?.includes('[Subset -')) return false
      return g.Title.startsWith(baseTitle + ' [') || g.Title.startsWith(baseTitle + ' |')
    })

    return cachedJson(subsets, TTL)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
