import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getUserWantToPlayList } from '@/lib/raClient'

const TTL = 15 * 60 * 1000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { rausername, raid, id } = session.user
  if (!rausername || !raid) {
    return NextResponse.json({ Count: 0, Total: 0, Results: [] })
  }

  try {
    const data = await withCache(
      `wantToPlay:${id}`,
      TTL,
      () => getUserWantToPlayList(rausername, raid),
      (d) => d !== null && typeof d === 'object' && 'Results' in d && Array.isArray((d as { Results: unknown }).Results),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
