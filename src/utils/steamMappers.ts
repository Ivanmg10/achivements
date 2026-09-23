import { gameIconUrl, gameLogoUrl, steamAssetUrl } from '@/lib/steamClient'
import type { RecentAchievement } from '@/types/types'
import type {
  SteamOwnedGame,
  SteamGameProgress,
  SteamPlayerAchievement,
  SteamSchemaAchievement,
  SteamAchievementUnified,
  SteamGlobalPercentagesResponse,
  SteamAppDetailsResponse,
  SteamGameDetails,
  SteamRecentAchievement,
} from '@/types/steam'

/**
 * Pure mapping from Steam's wire format to the unified model.
 *
 * `lastPlayed` is always ISO 8601 so RA and Steam entries sort against each
 * other as plain strings once the feeds are merged — RA's native
 * "YYYY-MM-DD HH:MM:SS" must be normalised the same way on its side.
 */

/** Steam has no console concept; the unified model needs the slot filled. */
export const STEAM_PLATFORM = 'Steam'

export function unixToIso(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null
  return new Date(seconds * 1000).toISOString()
}

/**
 * Maps an owned/recently-played game. Achievement counts start at zero because
 * they cost one API call per game — the achievements route fills them in later,
 * so a game with stats is not the same as a game with zero achievements.
 */
export function toSteamGameProgress(game: SteamOwnedGame): SteamGameProgress {
  return {
    _source: 'steam',
    id: game.appid,
    title: game.name ?? `App ${game.appid}`,
    imageIcon: gameIconUrl(game.appid, game.img_icon_url),
    consoleName: STEAM_PLATFORM,
    maxPossible: 0,
    numAwarded: 0,
    pctWon: 0,
    lastPlayed: unixToIso(game.rtime_last_played),
    playtimeForever: game.playtime_forever ?? 0,
    playtime2Weeks: game.playtime_2weeks ?? 0,
    imgLogoUrl: gameLogoUrl(game.appid, game.img_logo_url),
    hasStats: game.has_community_visible_stats === true,
    achievementsLoaded: false,
  }
}

/** Applies counts from a loaded achievement list onto a game. */
export function withAchievementCounts(
  game: SteamGameProgress,
  achievements: SteamAchievementUnified[],
): SteamGameProgress {
  const maxPossible = achievements.length
  const numAwarded = achievements.filter((a) => a.earned).length
  return {
    ...game,
    maxPossible,
    numAwarded,
    pctWon: maxPossible === 0 ? 0 : Math.round((numAwarded / maxPossible) * 10000) / 100,
    achievementsLoaded: true,
  }
}

/**
 * Joins the player's unlock state with the game schema. The schema holds the
 * display text and both badge icons; the player call holds only unlock state,
 * so a game is renderable from the schema alone (everything locked).
 */
export function toSteamAchievements(
  schema: SteamSchemaAchievement[],
  player: SteamPlayerAchievement[],
  globalPct: Map<string, number> = new Map(),
  likelyOnline: Set<string> = new Set(),
): SteamAchievementUnified[] {
  const unlocked = new Map(player.map((p) => [p.apiname, p]))

  return schema.map((def, index) => {
    const state = unlocked.get(def.name)
    const earned = state?.achieved === 1
    return {
      _source: 'steam',
      id: def.name,
      apiname: def.name,
      title: def.displayName || def.name,
      description: def.description ?? '',
      earned,
      dateEarned: earned ? unixToIso(state?.unlocktime) : null,
      // Always the colour badge: locked ones are greyed out in the UI, as RA
      // does. Steam's own icongray is often too dark to make out.
      badgeUrl: def.icon,
      displayOrder: index,
      hidden: def.hidden === 1,
      globalPct: globalPct.get(def.name) ?? null,
      likelyOnline: likelyOnline.has(def.name),
    }
  })
}

/**
 * apiname → share of players who have it. The live API sends percent as a
 * string; anything unparseable is dropped rather than shown as NaN.
 */
export function toGlobalPctMap(data: SteamGlobalPercentagesResponse | null | undefined): Map<string, number> {
  const map = new Map<string, number>()
  for (const a of data?.achievementpercentages?.achievements ?? []) {
    const pct = typeof a.percent === 'number' ? a.percent : parseFloat(a.percent)
    if (Number.isFinite(pct)) map.set(a.name, pct)
  }
  return map
}

/** Store appdetails → the trimmed shape the game page uses, or null if Steam has none. */
export function toSteamGameDetails(
  appId: number,
  data: SteamAppDetailsResponse | null | undefined,
): SteamGameDetails | null {
  const entry = data?.[String(appId)]
  if (!entry?.success || !entry.data) return null
  const d = entry.data
  return {
    appId,
    name: d.name,
    developers: d.developers ?? [],
    publishers: d.publishers ?? [],
    genres: (d.genres ?? []).map((g) => g.description),
    releaseDate: d.release_date?.date || null,
    description: d.short_description || null,
    screenshots: (d.screenshots ?? []).map((s) => ({ thumb: s.path_thumbnail, full: s.path_full })),
  }
}

/**
 * Fills counts from the player's unlock list alone. GetPlayerAchievements
 * returns every achievement of the game with an `achieved` flag, so the total
 * and the earned count both come from one call — no schema needed.
 *
 * An empty list is not "zero achievements": for a game that has stats it means
 * the data was unavailable (private profile), so the game stays unloaded.
 */
export function withPlayerAchievementCounts(
  game: SteamGameProgress,
  player: SteamPlayerAchievement[],
): SteamGameProgress {
  if (player.length === 0) return game
  const maxPossible = player.length
  const numAwarded = player.filter((p) => p.achieved === 1).length
  return {
    ...game,
    maxPossible,
    numAwarded,
    pctWon: Math.round((numAwarded / maxPossible) * 10000) / 100,
    achievementsLoaded: true,
  }
}

/**
 * A Steam unlock in RA's recent-achievement shape, so the main page's activity
 * charts (heatmap, daily chart, most-active games, day modal) work unchanged
 * for Steam. Dates follow RA's "YYYY-MM-DD HH:MM:SS" in UTC, which the charts
 * group by. Steam has no points or hardcore mode; images are full URLs, and
 * `Source` tells the charts to link to the Steam game page.
 *
 * Steam achievements have no numeric id, so `AchievementID` is the unlock's
 * position in its list — unique within it, which is all the charts key on.
 */
export function toRecentAchievement(a: SteamRecentAchievement, index: number): RecentAchievement {
  return {
    Date: a.unlockedAt.replace('T', ' ').slice(0, 19),
    HardcoreMode: '0',
    AchievementID: index,
    Title: a.title,
    Description: '',
    BadgeName: '',
    Points: 0,
    GameID: a.appId,
    GameTitle: a.gameTitle,
    ConsoleName: STEAM_PLATFORM,
    Source: 'steam',
    BadgeUrl: a.badgeUrl,
    GameIconUrl: steamAssetUrl(a.appId, 'header'),
  }
}
