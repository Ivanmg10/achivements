import type { GameSource } from '@/types/steam'

/**
 * A game identified across platforms. RA game ids and Steam appids share a
 * number space — RA game 730 and Steam app 730 are different games — so a bare
 * id is not enough wherever both can appear (pins, groups, search).
 */
export type GameRef = { source: GameSource; id: number }

export const GAME_SOURCES: readonly GameSource[] = ['ra', 'steam']

export function isGameSource(value: unknown): value is GameSource {
  return value === 'ra' || value === 'steam'
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
  return source === 'steam' ? `/steamGame/${id}` : `/gameInfo/${id}`
}
