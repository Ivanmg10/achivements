import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

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
      () => fetchRA(
        `https://retroachievements.org/API/API_GetUserWantToPlayList.php?u=${rausername}&y=${raid}`,
      ),
      (d) => d !== null && typeof d === 'object' && 'Results' in d && Array.isArray((d as { Results: unknown }).Results),
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
