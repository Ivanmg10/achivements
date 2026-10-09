import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getUserProfile } from '@/lib/raClient'

const TTL = 10 * 60 * 1000

/** The RA profile of the CheevoVault user `user`, for their public page. */
export async function GET(req: NextRequest) {
  if (!req.nextUrl.searchParams.get('user')) return NextResponse.json({ message: 'Missing user' }, { status: 400 })

  const auth = await requireRaSession(req)
  if (!auth.ok) return auth.response
  const { rausername, raid } = auth.session

  try {
    const data = await withCache(
      `publicProfile:${rausername.toLowerCase()}`,
      TTL,
      () => getUserProfile(rausername, raid),
      (d) => d !== null && typeof d === 'object' && 'User' in (d as object),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch RA profile' }, { status: 502 })
  }
}
