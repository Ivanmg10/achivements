import { raUnavailable } from '@/lib/raFailure'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getUserAwards } from '@/lib/raClient'
import { visibleAwardsForUser } from '@/lib/gameVisibility'
import type { UserAwards } from '@/types/types'

const TTL = 15 * 60 * 1000

export async function GET(req?: Request) {
  const auth = await requireRaSession(req)
  if (!auth.ok) return auth.response
  const { id, rausername, raid } = auth.session

  try {
    const data = await withCache<UserAwards>(
      `userAwards_v1:${id}`,
      TTL,
      async () => (await getUserAwards(rausername, raid)) as UserAwards,
      (d) => d !== null && typeof d === 'object' && 'TotalAwardsCount' in d,
    )
    const visible = await visibleAwardsForUser(id, data)
    return cachedJson(visible, 0)
  } catch (err) {
    return raUnavailable(err)
  }
}
