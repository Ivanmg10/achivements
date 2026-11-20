import { titleMatches } from '@/utils/gameCandidates'
import { gameHref, raGameId } from '@/utils/gameRef'
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
