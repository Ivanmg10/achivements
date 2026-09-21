import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getAppDetails } from '@/lib/steamClient'
import { toSteamGameDetails } from '@/utils/steamMappers'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { cachedJson } from '@/lib/httpCache'
import type { SteamAppDetailsResponse, SteamGameDetails } from '@/types/steam'

/**
 * Store details for a Steam game page: developer, publisher, genres, release
 * date, description, screenshots. The same for every user, so cached globally
 * per language — the store API is rate-limited harder than the Web API.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response

  const appIdRaw = req.nextUrl.searchParams.get('appid')
  if (!appIdRaw || !/^\d+$/.test(appIdRaw)) {
    return NextResponse.json({ message: 'Missing or invalid appid' }, { status: 400 })
  }
  const appId = Number(appIdRaw)
  const lang = parseSteamLanguage(req.nextUrl.searchParams.get('lang'))

  try {
    const details = await withSteamCache<SteamGameDetails | null>(
      `steamStore:${appId}:${lang}`,
      TTL.schema,
      async () => toSteamGameDetails(appId, (await getAppDetails(appId, lang)) as SteamAppDetailsResponse),
      // A delisted game has no store entry; do not pin that for a day in case it is a blip.
      { shouldCache: (d) => d !== null },
    )

    if (!details) return NextResponse.json({ message: 'No store details for this game' }, { status: 404 })
    return cachedJson(details, TTL.schema)
  } catch (err) {
    console.error('[steam/gameDetails]', appId, err)
    return NextResponse.json({ message: 'Steam store unavailable' }, { status: 503 })
  }
}
