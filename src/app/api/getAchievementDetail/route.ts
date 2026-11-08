import { raUnavailable } from '@/lib/raFailure'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getAchievementUnlocks, getAchievementComments } from '@/lib/raClient'

const TTL = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const auth = await requireRaSession()
  if (!auth.ok) return auth.response
  const { id, rausername, raid } = auth.session

  const achievementId = request.nextUrl.searchParams.get('achievementId')
  if (!achievementId || !/^\d+$/.test(achievementId)) {
    return NextResponse.json({ message: 'achievementId required' }, { status: 400 })
  }

  try {
    const data = await withCache(
      `achievementDetail:${id}:${achievementId}`,
      TTL,
      async () => {
        // A failure of either reaches the catch below: a pair with a failed half is never cached for five minutes.
        const [unlocks, comments] = await Promise.all([
          getAchievementUnlocks(rausername, raid, achievementId),
          getAchievementComments(rausername, raid, achievementId),
        ])

        return { unlocks, comments }
      },
      (d) => d !== null,
    )

    return cachedJson(data, TTL)
  } catch (err) {
    console.error('[getAchievementDetail]', err)
    return raUnavailable(err)
  }
}
