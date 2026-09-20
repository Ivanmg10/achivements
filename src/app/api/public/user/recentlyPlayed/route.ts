import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { getUserRecentlyPlayedGames } from '@/lib/raClient'

const TTL = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const auth = await requireViewerApiKey()
  if (!auth.ok) return auth.response

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ message: 'Missing username' }, { status: 400 })

  try {
    const data = await withCache(
      `publicRecentlyPlayed:${username.toLowerCase()}`,
      TTL,
      () => getUserRecentlyPlayedGames(username, auth.apiKey, 7),
      (d) => Array.isArray(d) && (d as unknown[]).length > 0,
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'Failed to fetch recently played games' }, { status: 502 })
  }
}
