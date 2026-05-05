import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'

const TTL = 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const gameId = request.nextUrl.searchParams.get('gameId')
  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: 'Invalid gameId' }, { status: 400 })
  }

  const { raid, id } = session.user
  if (!raid) {
    return NextResponse.json({ message: 'No RA account linked' }, { status: 400 })
  }

  const data = await withCache(
    `gameExtended_v1:${gameId}`,
    TTL,
    () => fetch(`https://retroachievements.org/API/API_GetGameExtended.php?i=${gameId}&y=${raid}`)
      .then((r) => r.json())
      .catch(() => null),
    (d) => d !== null && typeof d === 'object' && 'ID' in d,
  )

  if (data === null) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
