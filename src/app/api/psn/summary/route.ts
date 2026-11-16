import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure } from '@/lib/psnClient'
import { cachedJson } from '@/lib/httpCache'
import { psnSummary } from '@/lib/psnSnapshot'

/** How long the browser may keep an answer; the server's own cache is the longer one. Vary: Cookie (see cachedJson) lets the refresh button and a re-link through. */
const BROWSER_TTL_MS = 5 * 60 * 1000

/** The signed-in user's PSN headline numbers (trophy level, trophies by grade, games) and when Sony was last checked: from the snapshot, 202 before the first sync. */
export async function GET(req?: Request) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response

  try {
    return cachedJson(await psnSummary(auth.session.psnaccountid, auth.session.id), BROWSER_TTL_MS)
  } catch (err) {
    return psnFailure(err, 'psn/summary')
  }
}
