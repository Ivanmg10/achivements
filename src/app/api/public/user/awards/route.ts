import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { getUserAwards } from '@/lib/raClient'

const TTL = 15 * 60 * 1000

export async function GET(req: NextRequest) {
  const auth = await requireViewerApiKey()
  if (!auth.ok) return auth.response

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

  try {
    const data = await withCache(
      `publicAwards:${username.toLowerCase()}`,
      TTL,
      () => getUserAwards(username, auth.apiKey),
      (d) => d !== null && typeof d === 'object' && 'TotalAwardsCount' in (d as object),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch awards' }, { status: 502 })
  }
}
