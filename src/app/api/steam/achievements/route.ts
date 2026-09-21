import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getGlobalAchievementPercentages } from '@/lib/steamClient'
import { loadPlayerAchievements, loadSchema } from '@/lib/steamProgress'
import { toGlobalPctMap, toSteamAchievements } from '@/utils/steamMappers'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { cachedJson } from '@/lib/httpCache'
import type { SteamGlobalPercentagesResponse } from '@/types/steam'

/**
 * Achievements for one game: the schema (names, badges — localised) joined
 * with the player's unlock state and global rarity.
 *
 * The three parts cache separately because they change at different rates
 * and for different audiences: the schema per language for everyone (24h),
 * rarity for everyone (24h), unlock state per player (1h).
 */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { apiKey } = auth.session

  const appIdRaw = req.nextUrl.searchParams.get('appid')
  if (!appIdRaw || !/^\d+$/.test(appIdRaw)) {
    return NextResponse.json({ message: 'Missing or invalid appid' }, { status: 400 })
  }
  const appId = Number(appIdRaw)
  const lang = parseSteamLanguage(req.nextUrl.searchParams.get('lang'))

  try {
    const schema = await loadSchema(appId, apiKey, lang)

    // A game with no achievements at all needs no per-player call.
    if (schema.length === 0) return cachedJson([], TTL.schema)

    const [player, globalPct] = await Promise.all([
      loadPlayerAchievements(auth.session, appId),
      loadGlobalPct(appId),
    ])
    return cachedJson(toSteamAchievements(schema, player, globalPct), TTL.achievements)
  } catch (err) {
    console.error('[steam/achievements]', appId, err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}

/** Rarity is a nice-to-have: if Steam will not give it, the list still renders. */
async function loadGlobalPct(appId: number): Promise<Map<string, number>> {
  try {
    const data = await withSteamCache<SteamGlobalPercentagesResponse>(
      `steamGlobalPct:${appId}`,
      TTL.schema,
      async () => (await getGlobalAchievementPercentages(appId)) as SteamGlobalPercentagesResponse,
    )
    return toGlobalPctMap(data)
  } catch (err) {
    console.error('[steam/achievements] global pct', appId, err)
    return new Map()
  }
}
