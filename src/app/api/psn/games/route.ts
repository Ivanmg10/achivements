import { NextRequest } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { cachedJson } from '@/lib/httpCache'
import { psnFailure } from '@/lib/psnClient'
import { pageQuery, psnGamesPage, PSN_BROWSER_TTL_MS } from '@/lib/psnRoutes'
import { timedPsnRead } from '@/lib/psnMetrics'

/**
 * A page of the PSN library from the snapshot (#179): `?page=1&limit=50&q=&sort=recent|title|progress`, at most 50
 * games, hidden games and unticked consoles left out. `{ games, total, page, limit }`; 202 before the first sync.
 */
export const GET = timedPsnRead(async function GET(req: NextRequest) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response
  const params = req.nextUrl.searchParams
  try {
    return cachedJson(await psnGamesPage(auth.session, pageQuery(params), !params.has('user')), PSN_BROWSER_TTL_MS)
  } catch (err) {
    return psnFailure(err, 'psn/games')
  }
})
