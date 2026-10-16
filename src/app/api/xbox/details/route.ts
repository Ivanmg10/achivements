import { NextRequest, NextResponse } from 'next/server'
import { requireXboxSession } from '@/lib/apiAuth'
import { findXboxGame, isTitleId, xboxFailure } from '@/lib/xboxClient'
import { igdbXboxArt, igdbXboxDetails } from '@/lib/igdbClient'
import { cachedJson } from '@/lib/httpCache'
import { TTL } from '@/lib/steamCache'

/**
 * An Xbox game page's facts — summary, studios, genres, release date,
 * screenshots, and a wide picture for the backdrop — from IGDB, since Xbox's
 * library gives none: ?id=1738914043. The
 * game is looked up in the user's library, so the title searched for is Xbox's,
 * not text from the request. 404 when IGDB is not set up or knows no match: the
 * page simply has no details.
 */
export async function GET(req: NextRequest) {
  const auth = await requireXboxSession(req)
  if (!auth.ok) return auth.response
  const { id: userId, xboxxuid } = auth.session

  const titleId = req.nextUrl.searchParams.get('id') ?? ''
  if (!isTitleId(titleId)) return NextResponse.json({ error: 'invalid-title' }, { status: 400 })

  let game
  try {
    game = await findXboxGame(xboxxuid, titleId, userId)
  } catch (err) {
    return xboxFailure(err, 'xbox/details')
  }
  if (!game) return NextResponse.json({ error: 'not-in-library' }, { status: 404 })

  try {
    const details = await igdbXboxDetails(game.title, game.consoleName)
    if (!details) return NextResponse.json({ error: 'no-details' }, { status: 404 })
    // The backdrop is an extra: without it the page keeps the game's own tile.
    const heroUrl = await igdbXboxArt(game.title, game.consoleName)
      .then((art) => art?.heroUrl ?? null)
      .catch((err) => {
        console.error('[xbox/details] art', titleId, err)
        return null
      })
    return cachedJson({ ...details, heroUrl }, TTL.schema)
  } catch (err) {
    console.error('[xbox/details]', titleId, err)
    return NextResponse.json({ error: 'details-unavailable' }, { status: 503 })
  }
}
