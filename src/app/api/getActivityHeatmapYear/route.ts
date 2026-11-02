import { raUnavailable } from '@/lib/raFailure'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { loadRaYear } from '@/lib/raYear'
import { visibleGamesForUser } from '@/lib/gameVisibility'

export async function GET(req?: Request) {
  const auth = await requireRaSession(req)
  if (!auth.ok) return auth.response
  const { id, rausername, raid } = auth.session

  try {
    const merged = await loadRaYear(id, rausername, raid)
    const visible = await visibleGamesForUser(id, merged, 'ra', (achievement) => (achievement as { GameID: number }).GameID)
    return cachedJson(visible, 0)
  } catch (err) {
    // Rather than draw a hole: the buckets that did load stay cached, so the
    // client's retry only costs the one that failed.
    console.error('[getActivityHeatmapYear]', err)
    return raUnavailable(err)
  }
}
