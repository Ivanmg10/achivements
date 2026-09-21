import type { RecentlyPlayedGame } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'

/**
 * Pure helpers for putting Steam games next to RA ones: category rules, the
 * merged recent feed, and playtime formatting.
 */

export type SteamCategory = 'wantToPlay' | 'playing' | 'completed'

/**
 * Buckets a Steam game the same way RA's category pages bucket RA games, so
 * the two lists mean the same thing side by side:
 *
 * - completed  — every achievement earned (RA: PctWon >= 1)
 * - playing    — some but not all earned  (RA: 0 < PctWon < 1)
 * - wantToPlay — owned but never launched. RA's version is an explicit list;
 *                the Steam equivalent is the untouched backlog. A game with
 *                hours in it but no achievements is not "want to play".
 *
 * Anything else returns null and is left out: played but no achievements yet,
 * no achievements at all, or counts not loaded — progress unknown, so placing
 * it in playing/completed would be a guess.
 */
export function classifySteamGame(game: SteamGameProgress): SteamCategory | null {
  if (game.playtimeForever === 0) return 'wantToPlay'
  if (!game.achievementsLoaded || game.maxPossible === 0) return null
  if (game.numAwarded >= game.maxPossible) return 'completed'
  if (game.numAwarded > 0) return 'playing'
  return null
}

/**
 * RA reports LastPlayed as "YYYY-MM-DD HH:MM:SS" in UTC; Steam entries are ISO.
 * Both must be ISO to sort against each other as strings.
 */
export function raDateToIso(raDate: string | null | undefined): string | null {
  if (!raDate) return null
  const d = new Date(`${raDate.replace(' ', 'T')}Z`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export type RecentFeedItem =
  | { source: 'ra'; key: string; lastPlayed: string | null; game: RecentlyPlayedGame }
  | { source: 'steam'; key: string; lastPlayed: string | null; game: SteamGameProgress }

/**
 * One recent feed across both platforms, newest first. Keys are namespaced by
 * source because RA game ids and Steam appids share a number space — RA game
 * 730 and Steam app 730 are different games.
 *
 * Undated entries sort last. The sort is stable, so each platform's own order
 * survives among ties.
 */
export function mergeRecentFeeds(
  ra: RecentlyPlayedGame[],
  steam: SteamGameProgress[],
  limit: number,
): RecentFeedItem[] {
  const items: RecentFeedItem[] = [
    ...ra.map((game) => ({
      source: 'ra' as const,
      key: `ra:${game.GameID}`,
      lastPlayed: raDateToIso(game.LastPlayed),
      game,
    })),
    ...steam.map((game) => ({
      source: 'steam' as const,
      key: `steam:${game.id}`,
      lastPlayed: game.lastPlayed,
      game,
    })),
  ]

  return items
    .sort((a, b) => {
      if (a.lastPlayed === b.lastPlayed) return 0
      if (a.lastPlayed === null) return 1
      if (b.lastPlayed === null) return -1
      return b.lastPlayed.localeCompare(a.lastPlayed)
    })
    .slice(0, limit)
}

/**
 * Steam reports playtime in minutes. Units and locale both come in from the
 * caller so the number follows the app language, not the browser's locale.
 */
export function formatPlaytime(
  minutes: number,
  units: { minutes: string; hours: string },
  locale?: string,
): string {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} ${units.minutes}`
  const hours = minutes / 60
  const rounded = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours)
  return `${rounded.toLocaleString(locale)} ${units.hours}`
}

/**
 * True while some played game with achievements has no counts yet — the
 * server fills counts over several requests, and a game it could not fetch
 * stays unloaded. Until then playing/completed totals are a lower bound.
 */
export function hasUnloadedProgress(games: SteamGameProgress[]): boolean {
  return games.some((g) => g.hasStats && g.playtimeForever > 0 && !g.achievementsLoaded)
}

export function countLoadedProgress(games: SteamGameProgress[]): number {
  return games.filter((g) => g.achievementsLoaded).length
}
