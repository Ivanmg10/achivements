import { NextResponse } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getGameList } from '@/lib/raClient'

const CONSOLE_IDS = [3, 7, 5, 39, 41] // SNES, NES, GBA, GB, GBC
const COLLAGE_COUNT = 12
const TTL = 12 * 60 * 60 * 1000

type RawGame = {
  ID?: number
  Title?: string
  ImageIcon?: string
}

export type CollageGame = {
  id: number
  title: string
  imageIcon: string
}

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v)
}

export async function GET() {
  const apiKey = process.env.RA_API_KEY
  if (!apiKey) return NextResponse.json([])

  try {
    const selected = await withCache(
      'collageGames_v1',
      TTL,
      async () => {
        const lists = await Promise.all(
          CONSOLE_IDS.map((cid) =>
            getGameList(cid, apiKey, true).catch(() => [] as RawGame[]),
          ),
        )

        const all: CollageGame[] = (lists as RawGame[][])
          .flat()
          .filter((g) => g.ID && g.ImageIcon)
          .map((g) => ({ id: g.ID!, title: g.Title ?? '', imageIcon: g.ImageIcon! }))

        return shuffle(all).slice(0, COLLAGE_COUNT)
      },
      (d) => Array.isArray(d),
    )

    return cachedJson(selected, TTL)
  } catch {
    return NextResponse.json([])
  }
}
