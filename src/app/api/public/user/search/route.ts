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
  if (!username || username.trim().length < 2) {
    return NextResponse.json({ message: 'Missing username' }, { status: 400 })
  }

  const apiKey = session.user.raid ?? process.env.RA_API_KEY ?? null
  if (!apiKey) return NextResponse.json({ message: 'No RA API key configured' }, { status: 503 })

  const q = username.trim()

  try {
    const data = await withCache(
      `publicSearch:${q.toLowerCase()}`,
      TTL,
      () => fetchRA(`https://retroachievements.org/API/API_GetUserProfile.php?u=${encodeURIComponent(q)}&y=${apiKey}`),
      (d) => d !== null && typeof d === 'object' && 'User' in (d as object),
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }
}
