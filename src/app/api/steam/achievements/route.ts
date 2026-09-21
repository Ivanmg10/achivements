import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getAppCategories, getGlobalAchievementPercentages } from '@/lib/steamClient'
import { loadPlayerAchievements, loadSchema } from '@/lib/steamProgress'
import { toGlobalPctMap, toSteamAchievements } from '@/utils/steamMappers'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { hasOnlineModes, likelyOnlineNames } from '@/utils/steamOnline'
import { cachedJson } from '@/lib/httpCache'
import type { SteamAppDetailsResponse, SteamGlobalPercentagesResponse, SteamSchemaAchievement } from '@/types/steam'

/**
 * Achievements for one game: the schema (names, badges — localised) joined
 * with the player's unlock state, global rarity, and a guess at which need
 * online play.
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

    const [player, globalPct, online] = await Promise.all([
      loadPlayerAchievements(auth.session, appId),
      loadGlobalPct(appId),
      loadLikelyOnline(appId, apiKey, lang, schema),
    ])
    return cachedJson(toSteamAchievements(schema, player, globalPct, online), TTL.achievements)
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

/**
 * Which achievements probably need online play. The guess reads English text,
 * so a localised page loads the English schema too (cached like any schema).
 * Also a nice-to-have: on failure no achievement is marked.
 */
async function loadLikelyOnline(
  appId: number,
  apiKey: string,
  lang: string,
  schema: SteamSchemaAchievement[],
): Promise<Set<string>> {
  try {
    const [english, gameIsOnline] = await Promise.all([
      lang === 'english' ? schema : loadSchema(appId, apiKey, 'english'),
      loadOnlineModes(appId),
    ])
    return likelyOnlineNames(english, gameIsOnline)
  } catch (err) {
    console.error('[steam/achievements] online guess', appId, err)
    return new Set()
  }
}

/** Whether the store lists online modes; null when unknown, so only clear wording counts. */
async function loadOnlineModes(appId: number): Promise<boolean | null> {
  try {
    return await withSteamCache<boolean | null>(
      `steamOnlineModes:${appId}`,
      TTL.schema,
      async () => hasOnlineModes(appId, (await getAppCategories(appId)) as SteamAppDetailsResponse),
      { shouldCache: (v) => v !== null },
    )
  } catch (err) {
    console.error('[steam/achievements] store categories', appId, err)
    return null
  }
}
