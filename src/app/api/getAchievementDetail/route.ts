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

  const data = await withCache(
    `achievementDetail:${id}:${achievementId}`,
    TTL,
    async () => {
      const [unlocks, comments] = await Promise.all([
        getAchievementUnlocks(rausername, raid, achievementId).catch(() => null),
        getAchievementComments(rausername, raid, achievementId).catch(() => null),
      ])

      return { unlocks, comments }
    },
    (d) => d !== null,
  )

  if (!data) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return cachedJson(data, TTL)
}
