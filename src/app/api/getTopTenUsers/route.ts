import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { withCache } from '@/lib/raCache'

const TTL = 15 * 60 * 1000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'No autorizado' }, { status: 401 })

  const { raid } = session.user
  if (!raid) return NextResponse.json({ message: 'No RA account linked' }, { status: 400 })

  const data = await withCache(
    'topTenUsers_v1',
    TTL,
    () => fetch(`https://retroachievements.org/API/API_GetTopTenUsers.php?y=${raid}`)
      .then((r) => r.json()).catch(() => null),
    (d) => Array.isArray(d) && d.length > 0,
  )

  if (!data) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
