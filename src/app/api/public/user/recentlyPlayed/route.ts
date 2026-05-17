import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

const TTL = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

  const apiKey = session.user.raid ?? process.env.RA_API_KEY ?? null
  if (!apiKey) return NextResponse.json({ message: 'No RA API key configured' }, { status: 503 })

  try {
    const data = await withCache(
      `publicRecentlyPlayed:${username.toLowerCase()}`,
      TTL,
      () => fetchRA(`https://retroachievements.org/API/API_GetUserRecentlyPlayedGames.php?u=${encodeURIComponent(username)}&y=${apiKey}&c=7`),
      (d) => Array.isArray(d) && (d as unknown[]).length > 0,
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch recently played games' }, { status: 502 })
  }
}
