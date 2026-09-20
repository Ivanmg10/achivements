import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { getGameInfoAndUserProgress } from '@/lib/raClient'

const TTL = 10 * 60 * 1000

export async function GET(req: NextRequest) {
  const auth = await requireViewerApiKey()
  if (!auth.ok) return auth.response

  const username = req.nextUrl.searchParams.get('u')
  const gameId = req.nextUrl.searchParams.get('gameId')

  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })
  if (!gameId || !/^\d+$/.test(gameId)) return NextResponse.json({ message: 'Invalid gameId' }, { status: 400 })

  try {
    const data = await withCache(
      `publicGameProgression:${username.toLowerCase()}:${gameId}`,
      TTL,
      () => getGameInfoAndUserProgress(username, auth.apiKey, gameId),
      (d) => d !== null && typeof d === 'object' && 'ID' in (d as object),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch game progression' }, { status: 502 })
  }
}
