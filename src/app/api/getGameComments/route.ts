import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

const TTL = 5 * 60 * 1000

export type GameComment = {
  User: string
  Submitted: string
  CommentText: string
  ULID: string
}

export type GameCommentsResponse = {
  Count: number
  Total: number
  Results: GameComment[]
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const gameId = request.nextUrl.searchParams.get('gameId')
  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: 'Invalid gameId' }, { status: 400 })
  }

  const { raid } = session.user
  if (!raid) return NextResponse.json({ message: 'No RA account linked' }, { status: 400 })

  try {
    const data = await withCache(
      `gameComments_v1:${gameId}`,
      TTL,
      () => fetchRA(`https://retroachievements.org/API/API_GetComments.php?i=${gameId}&t=1&c=100&y=${raid}`),
      (d) => d !== null && typeof d === 'object' && 'Results' in d,
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
