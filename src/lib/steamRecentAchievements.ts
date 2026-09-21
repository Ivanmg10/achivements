import { getRecentlyPlayedGames } from '@/lib/steamClient'
import { loadPlayerAchievements, loadSchema, mapWithConcurrency, SteamAuth } from '@/lib/steamProgress'
import { unixToIso } from '@/utils/steamMappers'
import type { SteamRecentAchievement, SteamRecentlyPlayedResponse, SteamSchemaAchievement } from '@/types/steam'

/** Recent games scanned for unlocks — new achievements come from games played lately. */
const GAMES_SCANNED = 10
const CONCURRENCY = 4

/**
 * The player's latest unlocks across their recently played games — Steam has
 * no single "recent achievements" call like RA's, so it is assembled:
 *
 * 1. the recently played games,
 * 2. each game's unlock list (cached per player, shared with the game page),
 * 3. the newest `limit` unlocks overall,
 * 4. names and badges from those games' schemas (cached per language).
 *
 * Only the games that make the final list need a schema. A game that fails
 * at either step is skipped rather than failing the list, and an unlock
 * whose definition is missing falls back to its api name.
 */
export async function loadRecentAchievements(
  auth: SteamAuth,
  lang: string,
  limit = 5,
): Promise<SteamRecentAchievement[]> {
  const recent = (await getRecentlyPlayedGames(auth.steamid, auth.apiKey, GAMES_SCANNED)) as SteamRecentlyPlayedResponse
  const games = recent?.response?.games ?? []

  const perGame = await mapWithConcurrency(games, CONCURRENCY, async (game) => {
    try {
      return { game, unlocks: await loadPlayerAchievements(auth, game.appid) }
    } catch (err) {
      console.error('[steamRecentAchievements] unlocks', game.appid, err)
      return { game, unlocks: [] }
    }
  })

  // Unlocks with no timestamp predate Steam keeping them: they cannot be "recent".
  const newest = perGame
    .flatMap(({ game, unlocks }) =>
      unlocks
        .filter((u) => u.achieved === 1 && u.unlocktime > 0)
        .map((u) => ({ appId: game.appid, gameTitle: game.name ?? `App ${game.appid}`, apiname: u.apiname, unlocktime: u.unlocktime })),
    )
    .sort((a, b) => b.unlocktime - a.unlocktime)
    .slice(0, limit)

  const appIds = [...new Set(newest.map((u) => u.appId))]
  const schemas = new Map<number, SteamSchemaAchievement[]>(
    await Promise.all(
      appIds.map(async (appId): Promise<[number, SteamSchemaAchievement[]]> => {
        try {
          return [appId, await loadSchema(appId, auth.apiKey, lang)]
        } catch (err) {
          console.error('[steamRecentAchievements] schema', appId, err)
          return [appId, []]
        }
      }),
    ),
  )

  return newest.map((u) => {
    const def = schemas.get(u.appId)?.find((d) => d.name === u.apiname)
    return {
      appId: u.appId,
      gameTitle: u.gameTitle,
      apiname: u.apiname,
      title: def?.displayName || u.apiname,
      badgeUrl: def?.icon ?? '',
      unlockedAt: unixToIso(u.unlocktime)!,
    }
  })
}
