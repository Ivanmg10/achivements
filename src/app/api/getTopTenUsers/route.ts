import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'
import { fetchRA } from '@/lib/fetchRA'

const TTL = 15 * 60 * 1000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { raid } = session.user
  if (!raid) return NextResponse.json({ message: 'No RA account linked' }, { status: 400 })

  try {
    const data = await withCache(
      'topTenUsers_v1',
      TTL,
      () => fetchRA(`https://retroachievements.org/API/API_GetTopTenUsers.php?y=${raid}`),
      (d) => Array.isArray(d) && d.length > 0,
    )
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
