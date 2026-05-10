import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'

const TTL = 60 * 60 * 1000 // 1h — hashes don't change often

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const gameId = request.nextUrl.searchParams.get('gameId')
  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: 'Invalid gameId' }, { status: 400 })
  }

  const { raid } = session.user
  if (!raid) {
    return NextResponse.json({ message: 'No RA account linked' }, { status: 400 })
  }

  const data = await withCache(
    `gameHashes:${gameId}`,
    TTL,
    () =>
      fetch(`https://retroachievements.org/API/API_GetGameHashes.php?y=${raid}&i=${gameId}`)
        .then((r) => r.json())
        .catch(() => null),
    (d) => d !== null && typeof d === 'object' && 'Results' in d,
  )

  if (data === null) return NextResponse.json({ Results: [] })
  return NextResponse.json(data)
}
