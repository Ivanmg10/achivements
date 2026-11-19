import { NextRequest } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { cachedJson } from '@/lib/httpCache'
import { visibleGamesForUser } from '@/lib/gameVisibility'
import { psnFailure, psnLanguage } from '@/lib/psnClient'
import { PsnSyncing } from '@/lib/psnErrors'
import { pageQuery, psnGamesPage, PSN_BROWSER_TTL_MS } from '@/lib/psnRoutes'
import { psnLatestTrophies, psnSummary, psnSyncState } from '@/lib/psnSnapshot'

/**
 * Everything a first PSN screen needs in one read, from the snapshot (#179): the summary, the first 50 games
 * (most recently played, hidden ones left out), the latest trophies (null while they are first read) and the
 * sync state. 202 `syncing` while nothing is stored yet; the client asks again after `Retry-After`.
 */
export async function GET(req: NextRequest) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response
  const { id, psnaccountid } = auth.session
  const params = req.nextUrl.searchParams
  try {
    const summary = await psnSummary(psnaccountid, id)
    const [library, recent, sync] = await Promise.all([
      psnGamesPage(auth.session, pageQuery(new URLSearchParams()), !params.has('user')),
      psnLatestTrophies(psnaccountid, id, psnLanguage(params.get('lang'))).then(
        (trophies) => visibleGamesForUser(id, trophies, 'psn', (t) => t.gameId),
        (err: unknown) => {
          if (err instanceof PsnSyncing) return null
          throw err
        },
      ),
      psnSyncState(psnaccountid, id),
    ])
    return cachedJson({ summary, games: library.games, totalGames: library.total, recent, sync }, PSN_BROWSER_TTL_MS)
  } catch (err) {
    return psnFailure(err, 'psn/bootstrap')
  }
}
