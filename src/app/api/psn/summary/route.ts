import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure, psnLibrarySyncedAt, psnSummary } from '@/lib/psnClient'
import { cachedJson } from '@/lib/httpCache'
import { REFRESH_MS } from '@/lib/psnCache'

/** How long the browser may keep an answer; the server's own cache is the longer one. Vary: Cookie (see cachedJson) lets the refresh button and a re-link through. */
const BROWSER_TTL_MS = 5 * 60 * 1000

/** The signed-in user's PSN headline numbers (trophy level, trophies by grade, games) and when the library was last read from Sony. */
export async function GET(req?: Request) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response

  try {
    const { psnaccountid, id } = auth.session
    const summary = await psnSummary(psnaccountid, id)
    const syncedAt = await psnLibrarySyncedAt(psnaccountid)
    // From then on, the refresh button reads Sony again (once per REFRESH_MS, psnCache).
    const nextSyncAt = syncedAt === null ? null : syncedAt + REFRESH_MS
    return cachedJson({ ...summary, syncedAt, nextSyncAt }, BROWSER_TTL_MS)
  } catch (err) {
    return psnFailure(err, 'psn/summary')
  }
}
