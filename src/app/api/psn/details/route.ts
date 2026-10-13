import { NextRequest, NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { findPsnGame, psnFailure } from '@/lib/psnClient'
import { igdbDetails } from '@/lib/igdbClient'
import { cachedJson } from '@/lib/httpCache'
import { TTL } from '@/lib/steamCache'
import { isPsnTitleId } from '@/utils/psnTitles'

/**
 * A PSN game page's facts — summary, studios, genres, release date,
 * screenshots — from IGDB, since Sony gives none: ?id=NPWR12345_00. The game
 * is looked up in the user's list, so the title searched for is Sony's, not
 * text from the request. 404 when IGDB is not set up or knows no match: the
 * page simply has no details, as for a delisted Steam game.
 */
export async function GET(req: NextRequest) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response
  const { id: userId, psnaccountid } = auth.session

  const titleId = req.nextUrl.searchParams.get('id') ?? ''
  if (!isPsnTitleId(titleId)) return NextResponse.json({ error: 'invalid-title' }, { status: 400 })

  let game
  try {
    game = await findPsnGame(psnaccountid, titleId, userId)
  } catch (err) {
    return psnFailure(err, 'psn/details')
  }
  if (!game) return NextResponse.json({ error: 'not-in-library' }, { status: 404 })

  try {
    const details = await igdbDetails(game.title, game.consoleName)
    if (!details) return NextResponse.json({ error: 'no-details' }, { status: 404 })
    return cachedJson(details, TTL.schema)
  } catch (err) {
    console.error('[psn/details]', titleId, err)
    return NextResponse.json({ error: 'details-unavailable' }, { status: 503 })
  }
}
