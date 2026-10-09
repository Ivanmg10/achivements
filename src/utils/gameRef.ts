import type { GameSource } from '@/types/steam'
import { psnTitleId } from '@/utils/psnTitles'

/**
 * A game identified across platforms. RA game ids, Steam appids and PSN
 * trophy-set numbers share a number space — RA game 730 and Steam app 730 are
 * different games — so a bare id is not enough wherever several can appear
 * (pins, groups, search).
 */
export type GameRef = { source: GameSource; id: number }

export const GAME_SOURCES: readonly GameSource[] = ['ra', 'steam', 'psn']

export function isGameSource(value: unknown): value is GameSource {
  return value === 'ra' || value === 'steam' || value === 'psn'
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

/** Where a game's own page lives. */
export function gameHref(source: GameSource, id: number): string {
  if (source === 'steam') return `/steamGame/${id}`
  if (source === 'psn') return `/psnGame/${psnTitleId(id)}`
  return `/gameInfo/${id}`
}

/** Each platform's name as the app writes it. */
export const PLATFORM_NAME: Record<GameSource, string> = {
  ra: 'RetroAchievements',
  steam: 'Steam',
  psn: 'PlayStation',
}
