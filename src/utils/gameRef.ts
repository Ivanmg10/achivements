import type { GameSource } from '@/types/game'
import type { WantToPlayGame } from '@/types/types'
import type { CategoryGame } from '@/hooks/useGamesByCategory'
import { psnTitleId } from '@/utils/psnTitles'

/**
 * A game identified across platforms. RA game ids, Steam appids and PSN
 * trophy-set numbers share a number space — RA game 730 and Steam app 730 are
 * different games — so a bare id is not enough wherever several can appear
 * (pins, groups, search).
 */
export type GameRef = { source: GameSource; id: number }

export const GAME_SOURCES: readonly GameSource[] = ['ra', 'steam', 'psn', 'xbox']

export function isGameSource(value: unknown): value is GameSource {
  return GAME_SOURCES.includes(value as GameSource)
}

/**
 * An RA game's id, from a library game (`GameID`) or a want-to-play one (`ID`; its
 * `GameID`, when it has one, wins, as every list has always read it).
 */
export function raGameId(g: CategoryGame): number {
  return 'GameID' in g && g.GameID ? g.GameID : (g as WantToPlayGame).ID
}

/** Stable string form, for Set/Map keys and drag-and-drop ids: "ra:123", "steam:730". */
export function gameKey(source: GameSource, id: number): string {
  return `${source}:${id}`
}

export function parseGameKey(key: string): GameRef | null {
  const [source, raw] = key.split(':')
  const id = Number(raw)
  if (!isGameSource(source) || !Number.isInteger(id) || id <= 0) return null
  return { source, id }
}

/**
 * Where a game's own page lives. With `subject` (someone's public profile) it
 * is that user's progress in it instead: /user/<name>/<source>/<id>.
 */
export function gameHref(source: GameSource, id: number, subject?: string | null): string {
  const urlId = source === 'psn' ? psnTitleId(id) : String(id)
  if (subject) return `/user/${encodeURIComponent(subject)}/${source}/${urlId}`
  if (source === 'steam') return `/steamGame/${urlId}`
  if (source === 'psn') return `/psnGame/${urlId}`
  if (source === 'xbox') return `/xboxGame/${urlId}`
  return `/gameInfo/${urlId}`
}

/** Each platform's name as the app writes it (the AI export keeps "PlayStation Network" on purpose). */
export const PLATFORM_NAME: Record<GameSource, string> = {
  ra: 'RetroAchievements',
  steam: 'Steam',
  psn: 'PlayStation',
  xbox: 'Xbox',
}
