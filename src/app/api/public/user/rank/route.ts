import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { getUserRankAndScore } from '@/lib/raClient'

const TTL = 15 * 60 * 1000

export async function GET(req: NextRequest) {
  const auth = await requireViewerApiKey()
  if (!auth.ok) return auth.response

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

  try {
    const data = await withCache(
      `publicRank:${username.toLowerCase()}`,
      TTL,
      () => getUserRankAndScore(username, auth.apiKey),
      (d) => d !== null && typeof d === 'object' && 'Rank' in (d as object),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch rank' }, { status: 502 })
  }
}
