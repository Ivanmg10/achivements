import { NextResponse } from 'next/server'

const CONSOLE_IDS = [3, 7, 5, 39, 41] // SNES, NES, GBA, GB, GBC
const COLLAGE_COUNT = 12

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

let memCache: { data: CollageGame[]; ts: number } | null = null
const CACHE_TTL = 12 * 60 * 60 * 1000

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v)
}

export async function GET() {
  if (memCache && Date.now() - memCache.ts < CACHE_TTL) {
    return NextResponse.json(memCache.data)
  }

  const apiKey = process.env.RA_API_KEY
  if (!apiKey) return NextResponse.json([])

  try {
    const lists = await Promise.all(
      CONSOLE_IDS.map((cid) =>
        fetch(
          `https://retroachievements.org/API/API_GetGameList.php?i=${cid}&f=1&y=${apiKey}`,
          { next: { revalidate: 43200 } }
        )
          .then((r) => (r.ok ? (r.json() as Promise<RawGame[]>) : []))
          .catch(() => [] as RawGame[])
      )
    )

    const all: CollageGame[] = lists
      .flat()
      .filter((g) => g.ID && g.ImageIcon)
      .map((g) => ({ id: g.ID!, title: g.Title ?? '', imageIcon: g.ImageIcon! }))

    const selected = shuffle(all).slice(0, COLLAGE_COUNT)

    memCache = { data: selected, ts: Date.now() }
    return NextResponse.json(selected)
  } catch {
    return NextResponse.json([])
  }
}
