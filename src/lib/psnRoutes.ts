import { NextResponse } from 'next/server'
import { cachedJson } from '@/lib/httpCache'
import { visibleGamesForUser } from '@/lib/gameVisibility'
import { psnFailure, psnLanguage } from '@/lib/psnClient'
import { psnGame, psnLibrary } from '@/lib/psnSnapshot'
import { queryRows } from '@/lib/queryRows'
import { isConsoleShown } from '@/utils/consoleFilter'
import { isPsnTitleId } from '@/utils/psnTitles'
import { hiddenConsolesFrom } from '@/utils/vaultScoreInputs'
import type { PsnGameProgress } from '@/types/psn'

/**
 * How long the browser may keep a PSN read (#179). Every PSN read depends on who asks (a private profile is
 * refused to others), so it is `private` with `Vary: Cookie` (cachedJson), never a shared `s-maxage` copy.
 */
export const PSN_BROWSER_TTL_MS = 60 * 1000

type Session = { id: string; psnaccountid: string }

/** One game's trophies and groups, as /api/psn/trophies and /api/psn/game/[npwr] answer them. */
export async function psnGameResponse(session: Session, titleId: string, lang: string | null, where: string): Promise<NextResponse> {
  if (!isPsnTitleId(titleId)) return NextResponse.json({ error: 'invalid-title' }, { status: 400 })
  try {
    const game = await psnGame(session.psnaccountid, titleId, session.id, psnLanguage(lang))
    if (!game) return NextResponse.json({ error: 'not-in-library' }, { status: 404 })
    return cachedJson(game, PSN_BROWSER_TTL_MS)
  } catch (err) {
    return psnFailure(err, where)
  }
}

export const PAGE_LIMIT = 50
const SORTS = {
  recent: (a: PsnGameProgress, b: PsnGameProgress) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''),
  title: (a: PsnGameProgress, b: PsnGameProgress) => a.title.localeCompare(b.title),
  progress: (a: PsnGameProgress, b: PsnGameProgress) => b.pctWon - a.pctWon,
} as const
export type PsnSort = keyof typeof SORTS

/** `?page=&limit=&q=&sort=` read leniently: a page from 1, at most PAGE_LIMIT games, a known sort. */
export function pageQuery(params: URLSearchParams): { page: number; limit: number; q: string; sort: PsnSort } {
  const int = (v: string | null, fallback: number) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : fallback)
  const sort = params.get('sort') ?? 'recent'
  return {
    page: int(params.get('page'), 1),
    limit: Math.min(int(params.get('limit'), PAGE_LIMIT), PAGE_LIMIT),
    q: (params.get('q') ?? '').trim().toLowerCase().slice(0, 100),
    sort: sort in SORTS ? (sort as PsnSort) : 'recent',
  }
}

/**
 * A page of the account's library from the snapshot, without the owner's hidden games and, read by the owner,
 * without the consoles they unticked (someone else's list is shown whole, as the library context does).
 */
export async function psnGamesPage(session: Session, query: ReturnType<typeof pageQuery>, ownRead: boolean) {
  const [library, hiddenConsoles] = await Promise.all([psnLibrary(session.psnaccountid, session.id), ownRead ? consolesOff(session.id) : null])
  const visible = (await visibleGamesForUser(session.id, library, 'psn', (g) => g.id))
    .filter((g) => !hiddenConsoles || isConsoleShown(g.consoleName, hiddenConsoles))
    .filter((g) => !query.q || g.title.toLowerCase().includes(query.q))
    .sort(SORTS[query.sort])
  const start = (query.page - 1) * query.limit
  return { games: visible.slice(start, start + query.limit), total: visible.length, page: query.page, limit: query.limit }
}

async function consolesOff(userId: string): Promise<Set<string>> {
  const [row] = await queryRows<{ preferences: Record<string, unknown> | null }>('SELECT preferences FROM users WHERE id = $1', [userId])
  return hiddenConsolesFrom(row?.preferences, 'psn')
}
