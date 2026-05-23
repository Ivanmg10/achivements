import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

const TTL = 10 * 60 * 1000

function getApiKey(sessionRaid?: string | null): string | null {
  return sessionRaid ?? process.env.RA_API_KEY ?? null
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

  const apiKey = getApiKey(session.user.raid)
  if (!apiKey) return NextResponse.json({ message: 'No RA API key configured' }, { status: 503 })

  try {
    const data = await withCache(
      `publicProfile:${username.toLowerCase()}`,
      TTL,
      () => fetchRA(`https://retroachievements.org/API/API_GetUserProfile.php?u=${encodeURIComponent(username)}&y=${apiKey}`),
      (d) => d !== null && typeof d === 'object' && 'User' in (d as object),
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch RA profile' }, { status: 502 })
  }
}
