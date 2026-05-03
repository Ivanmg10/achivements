import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'

const TTL = 60 * 60 * 1000
const TOP_CONSOLES = 4
const RESULT_LIMIT = 8

type RawGame = {
  ID?: number
  GameID?: number
  ConsoleID?: number
  Title?: string
  ImageIcon?: string
  ConsoleName?: string
  NumAchievements?: number
  Points?: number
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { rausername, raid, id } = session.user

  const data = await withCache(
    `popularUnplayed_v2:${id}`,
    TTL,
    async () => {
      // Step 1: get all the user's completed games
      const completedRaw: RawGame[] | null = await fetch(
        `https://retroachievements.org/API/API_GetUserCompletedGames.php?u=${rausername}&y=${raid}`
      ).then((r) => r.json()).catch(() => null)

      if (!Array.isArray(completedRaw)) return null

      // Build set of played game IDs and console frequency map
      const playedIds = new Set<number>()
      const consoleCount: Record<number, number> = {}

      for (const g of completedRaw) {
        const gid = g.GameID ?? g.ID ?? 0
        const cid = g.ConsoleID ?? 0
        if (gid > 0) playedIds.add(gid)
        if (cid > 0) consoleCount[cid] = (consoleCount[cid] ?? 0) + 1
      }

      // Step 2: pick top consoles by play frequency (skip RA system consoles 100/101)
      const topConsoleIds = Object.entries(consoleCount)
        .filter(([cid]) => !['100', '101'].includes(cid))
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_CONSOLES)
        .map(([cid]) => Number(cid))

      if (topConsoleIds.length === 0) return []

      // Step 3: fetch game lists for those consoles in parallel (f=1 = only with achievements)
      const lists = await Promise.all(
        topConsoleIds.map((cid) =>
          fetch(`https://retroachievements.org/API/API_GetGameList.php?i=${cid}&f=1&y=${raid}`)
            .then((r) => r.json())
            .catch(() => [] as RawGame[])
        )
      )

      // Step 4: flatten, filter played, sort by Points desc, take top results
      const unplayed = lists
        .flat()
        .filter((g: RawGame) => {
          const gid = g.ID ?? g.GameID ?? 0
          return gid > 0 && !playedIds.has(gid)
        })
        .sort((a: RawGame, b: RawGame) => (b.Points ?? 0) - (a.Points ?? 0))
        .slice(0, RESULT_LIMIT)

      return unplayed
    },
    (d) => Array.isArray(d),
  )

  if (!data) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
