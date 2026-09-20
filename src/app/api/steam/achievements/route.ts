import { NextRequest, NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getPlayerAchievements, getSchemaForGame } from '@/lib/steamClient'
import { toSteamAchievements } from '@/utils/steamMappers'
import { cachedJson } from '@/lib/httpCache'
import type {
  SteamPlayerAchievementsResponse,
  SteamSchemaResponse,
  SteamSchemaAchievement,
  SteamPlayerAchievement,
} from '@/types/steam'

/**
 * Achievements for one game, joining the global schema (definitions, badges)
 * with the player's unlock state.
 *
 * The two halves cache separately and very differently: definitions are the
 * same for everyone and change only on a game update (24h, shared), while
 * unlock state is per player (1h). Caching them together would mean every
 * user re-downloading the same schema.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  const appIdRaw = req.nextUrl.searchParams.get('appid')
  if (!appIdRaw || !/^\d+$/.test(appIdRaw)) {
    return NextResponse.json({ message: 'Missing or invalid appid' }, { status: 400 })
  }
  const appId = Number(appIdRaw)

  try {
    const schema = await withSteamCache<SteamSchemaAchievement[]>(
      `steamSchema:${appId}`,
      TTL.schema,
      async () => {
        const data = (await getSchemaForGame(appId, apiKey)) as SteamSchemaResponse
        return data?.game?.availableGameStats?.achievements ?? []
      },
    )

    // A game with no achievements at all needs no per-player call.
    if (schema.length === 0) return cachedJson([], TTL.schema)

    const player = await withSteamCache<SteamPlayerAchievement[]>(
      `steamAch:${steamid}:${appId}`,
      TTL.achievements,
      async () => {
        try {
          const data = (await getPlayerAchievements(steamid, apiKey, appId)) as SteamPlayerAchievementsResponse
          return data?.playerstats?.success ? (data.playerstats.achievements ?? []) : []
        } catch (err) {
          // Steam answers 403 for a private profile. The game is still
          // renderable from the schema with everything locked, so degrade
          // instead of failing the whole request.
          if ((err as { status?: number }).status === 403) return []
          throw err
        }
      },
      { userId: id },
    )

    return cachedJson(toSteamAchievements(schema, player), TTL.achievements)
  } catch (err) {
    console.error('[steam/achievements]', appId, err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
