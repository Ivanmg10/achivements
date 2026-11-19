import { NextRequest, NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure } from '@/lib/psnClient'
import { findPsnGame } from '@/lib/psnSnapshot'
import { igdbDetails, igdbPsnArt } from '@/lib/igdbClient'
import { cachedJson } from '@/lib/httpCache'
import { TTL } from '@/lib/steamCache'
import { isPsnTitleId } from '@/utils/psnTitles'
import { timedPsnRead } from '@/lib/psnMetrics'

/**
 * A PSN game page's facts — summary, studios, genres, release date,
 * screenshots — from IGDB, since Sony gives none: ?id=NPWR12345_00, and the
 * cover of a game the Store gave none (`coverUrl`, null when it has one). The game
 * is looked up in the user's list, so the title searched for is Sony's, not
 * text from the request. 404 when IGDB is not set up or knows no match: the
 * page simply has no details, as for a delisted Steam game.
 */
export const GET = timedPsnRead(async function GET(req: NextRequest) {
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
    const [details, coverUrl] = await Promise.all([igdbDetails(game.title, game.consoleName), missingCover(game)])
    if (!details) return NextResponse.json({ error: 'no-details' }, { status: 404 })
    return cachedJson({ ...details, coverUrl }, TTL.schema, { sameForEveryone: true })
  } catch (err) {
    console.error('[psn/details]', titleId, err)
    return NextResponse.json({ error: 'details-unavailable' }, { status: 503 })
  }
})

/** IGDB's cover for a game the snapshot has none of; an extra, so a failure is no cover, not an error. */
async function missingCover(game: { title: string; consoleName: string; coverUrl: string | null }): Promise<string | null> {
  if (game.coverUrl) return null
  try {
    return (await igdbPsnArt(game.title, game.consoleName))?.coverUrl ?? null
  } catch (err) {
    console.error('[psn/details] cover', game.title, err)
    return null
  }
}
