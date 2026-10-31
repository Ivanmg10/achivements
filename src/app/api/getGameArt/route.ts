import { NextRequest, NextResponse } from 'next/server'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { cachedJson } from '@/lib/httpCache'
import { igdbRaArt } from '@/lib/igdbClient'
import { raUnavailable } from '@/lib/raFailure'
import { cachedGame, GAME_TTL_MS } from '@/lib/raGame'

/**
 * An RA game's pictures from IGDB, since RA's own are small screenshots:
 * ?gameId=1. The title searched for is RA's, not text from the request. Both are
 * null when IGDB is not set up or knows no match: the game keeps RA's pictures.
 */
export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get('gameId')
  if (!gameId || !/^\d+$/.test(gameId)) return NextResponse.json({ message: 'Invalid gameId' }, { status: 400 })

  const auth = await requireViewerApiKey()
  if (!auth.ok) return auth.response

  let game: { Title: string; ConsoleName: string }
  try {
    game = (await cachedGame(gameId, auth.apiKey)) as typeof game
  } catch (err) {
    return raUnavailable(err)
  }

  try {
    const art = await igdbRaArt(game.Title, game.ConsoleName)
    return cachedJson({ heroUrl: art?.heroUrl ?? null, coverUrl: art?.coverUrl ?? null }, GAME_TTL_MS)
  } catch (err) {
    console.error('[getGameArt]', gameId, err)
    return NextResponse.json({ message: 'IGDB unavailable' }, { status: 503 })
  }
}
