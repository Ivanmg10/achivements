import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { steamFailure } from '@/lib/steamFailure'
import { TTL } from '@/lib/steamCache'
import { loadGlobalPct, loadPlayerAchievements, loadSchema } from '@/lib/steamProgress'
import { toSteamAchievements } from '@/utils/steamMappers'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { cachedJson } from '@/lib/httpCache'
import type { SteamSchemaAchievement } from '@/types/steam'

/**
 * Achievements for one game: the schema (names, badges — localised) joined
 * with the player's unlock state, global rarity and — on a page in another
 * language — each one's English name, which guides (and the AI export) go by.
 *
 * The three parts cache separately because they change at different rates
 * and for different audiences: the schema per language for everyone (24h),
 * rarity for everyone (24h), unlock state per player (1h).
 */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession(req)
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

    const [player, globalPct, english] = await Promise.all([
      loadPlayerAchievements(auth.session, appId),
      loadGlobalPct(appId),
      lang === 'english' ? schema : loadEnglishSchema(appId, apiKey),
    ])
    const englishTitles = lang === 'english' ? undefined : new Map(english.map((a) => [a.name, a.displayName]))
    return cachedJson(toSteamAchievements(schema, player, globalPct, englishTitles), TTL.achievements)
  } catch (err) {
    console.error('[steam/achievements]', appId, err)
    return steamFailure(err)
  }
}

/**
 * The English schema, for a page in another language (cached like any schema):
 * guides go by English names. A nice-to-have: on failure it is empty, so
 * nothing is named.
 */
async function loadEnglishSchema(appId: number, apiKey: string): Promise<SteamSchemaAchievement[]> {
  try {
    return await loadSchema(appId, apiKey, 'english')
  } catch (err) {
    console.error('[steam/achievements] english schema', appId, err)
    return []
  }
}
