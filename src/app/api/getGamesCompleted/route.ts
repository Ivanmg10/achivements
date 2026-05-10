import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

const TTL = 10 * 60 * 1000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { rausername, raid, id } = session.user
  if (!rausername || !raid) {
    return NextResponse.json([], { status: 200 })
  }

  try {
    const data = await withCache(
      `gamesCompleted:${id}`,
      TTL,
      () => fetchRA(
        `https://retroachievements.org/API/API_GetUserCompletedGames.php?u=${rausername}&y=${raid}`,
      ),
      // Never cache empty — avoids pinning a transient RA failure as "no games" for the full TTL
      (d) => Array.isArray(d) && (d as unknown[]).length > 0,
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
