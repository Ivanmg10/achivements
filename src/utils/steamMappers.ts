import { gameIconUrl, gameLogoUrl } from '@/lib/steamClient'
import type {
  SteamOwnedGame,
  SteamGameProgress,
  SteamPlayerAchievement,
  SteamSchemaAchievement,
  SteamAchievementUnified,
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
  const numAwarded = achievements.filter((a) => a.dateEarned !== null).length
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
      dateEarned: earned ? unixToIso(state?.unlocktime) : null,
      // Steam ships a separate greyed-out badge for locked achievements.
      badgeUrl: earned ? def.icon : def.icongray,
      displayOrder: index,
      hidden: def.hidden === 1,
    }
  })
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
