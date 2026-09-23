import { getOwnedGames, getRecentlyPlayedGames } from '@/lib/steamClient'
import { loadGlobalPct, loadPlayerAchievements, loadSchema, mapWithConcurrency, SteamAuth } from '@/lib/steamProgress'
import { unixToIso } from '@/utils/steamMappers'
import type {
  SteamOwnedGamesResponse,
  SteamRecentAchievement,
  SteamRecentlyPlayedResponse,
  SteamSchemaAchievement,
} from '@/types/steam'

/** Recent games scanned for unlocks — new achievements come from games played lately. */
const GAMES_SCANNED = 10
const CONCURRENCY = 4
/**
 * Games scanned for the activity window. Each costs one unlock-list call
 * (cached per player for an hour), so the most recently played are kept.
 */
const ACTIVITY_GAMES_MAX = 30

type Unlock = { appId: number; gameTitle: string; apiname: string; unlocktime: number }

/**
 * Every dated unlock in the given games. A game that fails is skipped rather
 * than failing the list. Unlocks with no timestamp predate Steam keeping them.
 */
async function unlocksOf(auth: SteamAuth, games: { appid: number; name?: string }[]): Promise<Unlock[]> {
  const perGame = await mapWithConcurrency(games, CONCURRENCY, async (game) => {
    try {
      return { game, unlocks: await loadPlayerAchievements(auth, game.appid) }
    } catch (err) {
      console.error('[steamRecentAchievements] unlocks', game.appid, err)
      return { game, unlocks: [] }
    }
  })
  return perGame.flatMap(({ game, unlocks }) =>
    unlocks
      .filter((u) => u.achieved === 1 && u.unlocktime > 0)
      .map((u) => ({ appId: game.appid, gameTitle: game.name ?? `App ${game.appid}`, apiname: u.apiname, unlocktime: u.unlocktime })),
  )
}

/**
 * Names, badges and global rarity for a list of unlocks, from their games'
 * schemas (cached per language) and global percentages (cached for everyone).
 * An unlock whose definition is missing falls back to its api name.
 */
async function describe(auth: SteamAuth, lang: string, unlocks: Unlock[]): Promise<SteamRecentAchievement[]> {
  const appIds = [...new Set(unlocks.map((u) => u.appId))]
  const [schemas, rarity] = await Promise.all([
    Promise.all(
      appIds.map(async (appId): Promise<[number, SteamSchemaAchievement[]]> => {
        try {
          return [appId, await loadSchema(appId, auth.apiKey, lang)]
        } catch (err) {
          console.error('[steamRecentAchievements] schema', appId, err)
          return [appId, []]
        }
      }),
    ).then((entries) => new Map(entries)),
    Promise.all(
      appIds.map(async (appId): Promise<[number, Map<string, number>]> => [appId, await loadGlobalPct(appId)]),
    ).then((entries) => new Map(entries)),
  ])

  return unlocks.map((u) => {
    const def = schemas.get(u.appId)?.find((d) => d.name === u.apiname)
    return {
      appId: u.appId,
      gameTitle: u.gameTitle,
      apiname: u.apiname,
      title: def?.displayName || u.apiname,
      badgeUrl: def?.icon ?? '',
      unlockedAt: unixToIso(u.unlocktime)!,
      globalPct: rarity.get(u.appId)?.get(u.apiname) ?? null,
    }
  })
}

/**
 * The player's latest unlocks across their recently played games — Steam has
 * no single "recent achievements" call like RA's, so it is assembled:
 *
 * 1. the recently played games,
 * 2. each game's unlock list (cached per player, shared with the game page),
 * 3. the newest `limit` unlocks overall,
 * 4. names and badges from those games' schemas (cached per language).
 *
 * Only the games that make the final list need a schema.
 */
export async function loadRecentAchievements(
  auth: SteamAuth,
  lang: string,
  limit = 5,
): Promise<SteamRecentAchievement[]> {
  const recent = (await getRecentlyPlayedGames(auth.steamid, auth.apiKey, GAMES_SCANNED)) as SteamRecentlyPlayedResponse
  const newest = (await unlocksOf(auth, recent?.response?.games ?? []))
    .sort((a, b) => b.unlocktime - a.unlocktime)
    .slice(0, limit)
  return describe(auth, lang, newest)
}

/**
 * Every unlock of the last `days` days, newest first — what the main page's
 * activity heatmap, daily chart and most-active games need for Steam.
 *
 * "Recently played" only covers two weeks, so the games come from the library
 * instead: those with stats last played inside the window, the most recent
 * `ACTIVITY_GAMES_MAX` of them.
 */
export async function loadActivityAchievements(
  auth: SteamAuth,
  lang: string,
  days = 60,
  now = Date.now(),
): Promise<SteamRecentAchievement[]> {
  const cutoff = Math.floor(now / 1000) - days * 86_400
  const owned = (await getOwnedGames(auth.steamid, auth.apiKey)) as SteamOwnedGamesResponse
  const games = (owned?.response?.games ?? [])
    .filter((g) => g.has_community_visible_stats && (g.rtime_last_played ?? 0) >= cutoff)
    .sort((a, b) => (b.rtime_last_played ?? 0) - (a.rtime_last_played ?? 0))
    .slice(0, ACTIVITY_GAMES_MAX)

  const inWindow = (await unlocksOf(auth, games))
    .filter((u) => u.unlocktime >= cutoff)
    .sort((a, b) => b.unlocktime - a.unlocktime)
  return describe(auth, lang, inWindow)
}
