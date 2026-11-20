import { titleMatches } from '@/utils/gameCandidates'
import { gameHref, PLATFORM_NAME, raGameId } from '@/utils/gameRef'
import { matchesQuick, type LibraryEntry, type QuickFilter } from '@/utils/libraryInsights'
import type { GameSource } from '@/types/game'

export const entryId = (e: LibraryEntry): number => (e.kind === 'ra' ? raGameId(e.game) : e.game.id)
export const entryHref = (e: LibraryEntry) => gameHref(e.kind, entryId(e))

export type ExplorerFilter = { query: string; source: GameSource | 'all'; quick: QuickFilter }

/** The title search, the platform chip and the quick filter, applied together. */
export function filterEntries(entries: LibraryEntry[], { query, source, quick }: ExplorerFilter, now = Date.now()): LibraryEntry[] {
  return entries.filter((e) => (source === 'all' || e.kind === source) && matchesQuick(e, quick, now) && titleMatches(e.title, query))
}

/** How many games each platform has among these, for the chips. */
export function countBySource(entries: LibraryEntry[]): Record<GameSource, number> {
  const out: Record<GameSource, number> = { ra: 0, steam: 0, psn: 0, xbox: 0 }
  for (const e of entries) out[e.kind]++
  return out
}

/**
 * The console a game is on, as a row of the library names it (#155, #169): RA's console, PSN's
 * ("PS4"), the first of an Xbox game's ("Xbox 360", not every console that plays it); Steam has
 * none, so the platform.
 */
export function entryConsole(e: LibraryEntry): string {
  if (e.kind === 'ra') return e.game.ConsoleName || PLATFORM_NAME.ra
  if (e.kind === 'steam') return PLATFORM_NAME.steam
  return e.game.consoleName?.split(' · ')[0] || PLATFORM_NAME[e.kind]
}
