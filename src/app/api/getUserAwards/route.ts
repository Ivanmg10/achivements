import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'

const TTL = 15 * 60 * 1000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { rausername, raid, id } = session.user
  const data = await withCache(
    `userAwards_v1:${id}`,
    TTL,
    () => fetch(`https://retroachievements.org/API/API_GetUserAwards.php?u=${rausername}&y=${raid}`)
      .then((r) => r.json()).catch(() => null),
    (d) => d !== null && typeof d === 'object' && 'TotalAwardsCount' in d,
  )

  if (data === null) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
