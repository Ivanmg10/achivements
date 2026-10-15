import { NextRequest, NextResponse } from 'next/server'
import { requireXboxSession } from '@/lib/apiAuth'
import { findXboxGame, isTitleId, xboxFailure, xboxGameAchievements, xboxLanguage } from '@/lib/xboxClient'

/**
 * One game's achievements for the signed-in user: ?id=1738914043&lang=es. The
 * game is looked up in their library, which says which endpoint it is on (Xbox
 * 360 or newer) and when it was last played — the cache key. Texts come in the
 * app's language.
 */
export async function GET(req: NextRequest) {
  const auth = await requireXboxSession(req)
  if (!auth.ok) return auth.response
  const { id: userId, xboxxuid } = auth.session

  const titleId = req.nextUrl.searchParams.get('id') ?? ''
  const language = xboxLanguage(req.nextUrl.searchParams.get('lang'))
  if (!isTitleId(titleId)) return NextResponse.json({ error: 'invalid-title' }, { status: 400 })

  try {
    const game = await findXboxGame(xboxxuid, titleId, userId)
    if (!game) return NextResponse.json({ error: 'not-in-library' }, { status: 404 })
    return NextResponse.json({ achievements: await xboxGameAchievements(xboxxuid, game, userId, language) })
  } catch (err) {
    return xboxFailure(err, 'xbox/achievements')
  }
}
