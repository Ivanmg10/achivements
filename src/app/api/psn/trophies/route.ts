import { NextRequest, NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { findPsnGame, psnFailure, psnGameGroups, psnGameTrophies, psnLanguage } from '@/lib/psnClient'
import { isPsnTitleId } from '@/utils/psnTitles'

/**
 * One game's trophies and trophy groups (base game, each DLC) for the
 * signed-in user: ?id=NPWR12345_00&lang=es. The game is looked up in their
 * list, which says which trophy service it is on (PS5 or older) and when it
 * last changed — the cache key. Texts come in the app's language.
 */
export async function GET(req: NextRequest) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response
  const { id: userId, psnaccountid } = auth.session

  const titleId = req.nextUrl.searchParams.get('id') ?? ''
  const language = psnLanguage(req.nextUrl.searchParams.get('lang'))
  if (!isPsnTitleId(titleId)) return NextResponse.json({ error: 'invalid-title' }, { status: 400 })

  try {
    const game = await findPsnGame(psnaccountid, titleId, userId)
    if (!game) return NextResponse.json({ error: 'not-in-library' }, { status: 404 })
    const [groups, trophies] = await Promise.all([
      psnGameGroups(psnaccountid, game, userId, language),
      psnGameTrophies(psnaccountid, game, userId, language),
    ])
    return NextResponse.json({ groups, trophies })
  } catch (err) {
    return psnFailure(err, 'psn/trophies')
  }
}
