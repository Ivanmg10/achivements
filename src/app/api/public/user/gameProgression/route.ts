import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

const TTL = 10 * 60 * 1000

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const username = req.nextUrl.searchParams.get('u')
  const gameId = req.nextUrl.searchParams.get('gameId')

  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })
  if (!gameId || !/^\d+$/.test(gameId)) return NextResponse.json({ message: 'Invalid gameId' }, { status: 400 })

  const apiKey = session.user.raid ?? process.env.RA_API_KEY ?? null
  if (!apiKey) return NextResponse.json({ message: 'No RA API key configured' }, { status: 503 })

  try {
    const data = await withCache(
      `publicGameProgression:${username.toLowerCase()}:${gameId}`,
      TTL,
      () => fetchRA(`https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?u=${encodeURIComponent(username)}&y=${apiKey}&g=${gameId}`),
      (d) => d !== null && typeof d === 'object' && 'ID' in (d as object),
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch game progression' }, { status: 502 })
  }
}
