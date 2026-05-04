import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

const TTL = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const achievementId = request.nextUrl.searchParams.get('achievementId')
  if (!achievementId) {
    return NextResponse.json({ message: 'achievementId required' }, { status: 400 })
  }

  const { rausername, raid, id } = session.user

  const data = await withCache(
    `achievementDetail:${id}:${achievementId}`,
    TTL,
    async () => {
      const [unlocks, comments] = await Promise.all([
        fetchWithRetry(
          `https://retroachievements.org/API/API_GetAchievementUnlocks.php?z=${rausername}&y=${raid}&a=${achievementId}&c=10`,
        ).catch(() => null),
        fetchWithRetry(
          `https://retroachievements.org/API/API_GetComments.php?z=${rausername}&y=${raid}&i=${achievementId}&t=2&c=500`,
        ).catch(() => null),
      ])

      return { unlocks, comments }
    },
    (d) => d !== null,
  )

  if (!data) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
