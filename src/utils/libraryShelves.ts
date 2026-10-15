import { titleMatches } from '@/utils/gameCandidates'
import { gameHref } from '@/utils/gameRef'
import { matchesQuick, type LibraryEntry, type QuickFilter } from '@/utils/libraryInsights'
import type { GameSource } from '@/types/steam'

export type ShelfId = 'continue' | 'almost' | 'stalled' | 'rest' | 'recent' | 'older' | 'start' | 'backlog'

export type Shelf = {
  id: ShelfId
  entries: LibraryEntry[]
  /** Most cards the shelf shows; the rest is a click away. */
  cap: number
  /** The quick filter "see all" opens with. */
  quick: QuickFilter
}

/** What a shelf's grid holds: four across, then a featured game with four beside it. */
export const SHELF_CAP = 9
/** Played this recently, a game is one you are in the middle of. */
export const CONTINUE_DAYS = 7
const DAY = 86_400_000

export const entryId = (e: LibraryEntry): number => (e.kind === 'ra' ? ('GameID' in e.game && e.game.GameID ? e.game.GameID : (e.game as { ID: number }).ID) : e.game.id)
export const entryHref = (e: LibraryEntry) => gameHref(e.kind, entryId(e))

/** How many achievements the game has, for ordering a backlog; RA's want-to-play list reports it differently. */
export function entryTotal(e: LibraryEntry): number {
  if (e.kind !== 'ra') return e.game.maxPossible
  return 'AchievementsPublished' in e.game ? (e.game.AchievementsPublished ?? 0) : e.game.MaxPossible
}

/** What the game has earned of what it has, as its platform counts it; none for a game not started (want to play). */
export function entryCounts(e: LibraryEntry): { earned: number; total: number } | null {
  if (e.kind !== 'ra') return e.game.maxPossible > 0 ? { earned: e.game.numAwarded, total: e.game.maxPossible } : null
  return 'NumAwarded' in e.game && e.game.MaxPossible > 0 ? { earned: e.game.NumAwarded, total: e.game.MaxPossible } : null
}

/** "today", "2 days ago", "3 months ago": when it was last played, in the app language; empty when unknown. */
export function lastPlayedAgo(iso: string | null, lang: string, now = Date.now()): string {
  const t = iso ? Date.parse(iso) : NaN
  if (Number.isNaN(t)) return ''
  const days = Math.max(0, Math.floor((now - t) / DAY))
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (days < 30) return rtf.format(-days, 'day')
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month')
  return rtf.format(-Math.floor(days / 365), 'year')
}

const time = (e: LibraryEntry) => {
  const t = e.lastPlayed ? Date.parse(e.lastPlayed) : NaN
  return Number.isNaN(t) ? -Infinity : t
}
const recentFirst = (a: LibraryEntry, b: LibraryEntry) => time(b) - time(a) || a.title.localeCompare(b.title)
const closestFirst = (a: LibraryEntry, b: LibraryEntry) => (b.pct ?? -1) - (a.pct ?? -1) || recentFirst(a, b)

/**
 * The shelves a status list opens on: what to pick up next, grouped by what
 * the game needs rather than by platform. A game sits on one shelf only, the
 * first that claims it. Empty shelves are left out.
 */
export function buildShelves(entries: LibraryEntry[], category: string, now = Date.now()): Shelf[] {
  const taken = new Set<string>()
  const take = (list: LibraryEntry[]) => list.filter((e) => !taken.has(e.key) && (taken.add(e.key), true))
  const shelf = (id: ShelfId, list: LibraryEntry[], quick: QuickFilter = 'all'): Shelf => ({ id, entries: list, quick, cap: SHELF_CAP })

  const out: Shelf[] =
    category === 'completed'
      ? [
          shelf('recent', take([...entries].sort(recentFirst).slice(0, SHELF_CAP))),
          shelf('older', take([...entries].sort(recentFirst))),
        ]
      : category === 'wantToPlay'
        ? [
            shelf('start', take([...entries].sort((a, b) => entryTotal(a) - entryTotal(b) || a.title.localeCompare(b.title)).slice(0, SHELF_CAP))),
            shelf('backlog', take([...entries].sort((a, b) => a.title.localeCompare(b.title)))),
          ]
        : [
            shelf('continue', take(entries.filter((e) => now - time(e) <= CONTINUE_DAYS * DAY).sort(recentFirst))),
            shelf('almost', take(entries.filter((e) => matchesQuick(e, 'almost', now)).sort(closestFirst)), 'almost'),
            shelf('stalled', take(entries.filter((e) => matchesQuick(e, 'stalled', now)).sort((a, b) => time(a) - time(b))), 'stalled'),
            shelf('rest', take([...entries].sort(recentFirst))),
          ]
  return out.filter((s) => s.entries.length > 0)
}

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
