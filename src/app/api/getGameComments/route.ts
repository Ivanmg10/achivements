import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getGameComments } from '@/lib/raClient'

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
  const auth = await requireRaSession()
  if (!auth.ok) return auth.response
  const { raid } = auth.session

  const gameId = request.nextUrl.searchParams.get('gameId')
  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ message: 'Invalid gameId' }, { status: 400 })
  }

  try {
    const data = await withCache(
      `gameComments_v1:${gameId}`,
      TTL,
      () => getGameComments(gameId, raid),
      (d) => d !== null && typeof d === 'object' && 'Results' in d,
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
