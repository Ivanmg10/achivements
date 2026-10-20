import { requireXboxSession } from '@/lib/apiAuth'
import { xboxFailure, xboxSummary } from '@/lib/xboxClient'
import { cachedJson } from '@/lib/httpCache'

// The browser may keep it this long; the server's own cache is the longer one. Vary: Cookie (see cachedJson) lets the refresh button and a re-link through.
const BROWSER_TTL_MS = 5 * 60 * 1000

/** The signed-in user's Xbox headline numbers: gamertag, gamerscore, achievements unlocked, games. */
export async function GET(req?: Request) {
  const auth = await requireXboxSession(req)
  if (!auth.ok) return auth.response

  try {
    return cachedJson(await xboxSummary(auth.session.xboxxuid, auth.session.xboxgamertag, auth.session.id), BROWSER_TTL_MS)
  } catch (err) {
    return xboxFailure(err, 'xbox/summary')
  }
}
