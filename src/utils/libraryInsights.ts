import type { CategoryGame } from '@/hooks/useGamesByCategory'
import type { GameExtraData } from '@/components/statusGameList/StatusGameList'
import type { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { StatusSortState } from '@/components/status-sort-control/StatusSortControl'
import { compareSortValues } from '@/utils/utils'

export type QuickFilter = 'all' | 'almost' | 'stalled'

/** The orders every platform can be sorted by: points are RA's alone, so the mixed list does not offer them. */
export const MIXED_SORT_KEYS = ['name', 'lastPlayed', 'percent'] as const
export const QUICK_FILTERS: readonly QuickFilter[] = ['all', 'almost', 'stalled']

/** From this progress (and below 100) a game is "almost done". */
export const ALMOST_PCT = 80
/** Untouched for this long, an unfinished game is "stalled". */
export const STALLED_DAYS = 90
const DAY = 86_400_000

/** What the quick filters need from a game of any platform. */
export type Progress = { pct: number | null; lastPlayed: string | null }

export function matchesQuick({ pct, lastPlayed }: Progress, quick: QuickFilter, now = Date.now()): boolean {
  if (quick === 'all') return true
  if (quick === 'almost') return pct !== null && pct >= ALMOST_PCT && pct < 100
  // No date, no verdict: a game whose last session is unknown is never called stalled.
  const t = lastPlayed ? Date.parse(lastPlayed) : NaN
  return !Number.isNaN(t) && now - t > STALLED_DAYS * DAY
}

export function countQuick(items: Progress[], now = Date.now()): Record<QuickFilter, number> {
  return {
    all: items.length,
    almost: items.filter((p) => matchesQuick(p, 'almost', now)).length,
    stalled: items.filter((p) => matchesQuick(p, 'stalled', now)).length,
  }
}

const raId = (g: CategoryGame) => ('GameID' in g && g.GameID ? g.GameID : (g as { ID: number }).ID)

export const raProgress = (g: CategoryGame, extra?: GameExtraData): Progress => ({
  pct: 'PctWon' in g ? Math.round(parseFloat((g as RetroAchievementsGameCompleted).PctWon) * 100) : null,
  lastPlayed: extra?.lastPlayed ?? null,
})
export const steamProgress = (g: SteamGameProgress): Progress => ({ pct: g.pctWon, lastPlayed: g.lastPlayed })
export const psnProgress = (g: PsnGameProgress): Progress => ({ pct: g.pctWon, lastPlayed: g.lastPlayed ?? g.lastTrophyAt })

/** One game of any platform in the mixed list, with what the common sort reads. */
export type LibraryEntry = Progress & { key: string; title: string } & (
  | { kind: 'ra'; game: CategoryGame; extra?: GameExtraData }
  | { kind: 'steam'; game: SteamGameProgress }
  | { kind: 'psn'; game: PsnGameProgress }
)

export function buildEntries(
  ra: CategoryGame[],
  extra: Map<number, GameExtraData>,
  steam: SteamGameProgress[],
  psn: PsnGameProgress[],
): LibraryEntry[] {
  return [
    ...ra.map((game): LibraryEntry => {
      const e = extra.get(raId(game))
      return { kind: 'ra', key: `ra:${raId(game)}`, title: game.Title, game, extra: e, ...raProgress(game, e) }
    }),
    ...steam.map((game): LibraryEntry => ({ kind: 'steam', key: `steam:${game.id}`, title: game.title, game, ...steamProgress(game) })),
    ...psn.map((game): LibraryEntry => ({ kind: 'psn', key: `psn:${game.id}`, title: game.title, game, ...psnProgress(game) })),
  ]
}

/** The mixed list's order. "points" is RA's alone, so it is not offered here. */
export function sortEntries(entries: LibraryEntry[], { key, dir }: StatusSortState): LibraryEntry[] {
  const value = (e: LibraryEntry) => (key === 'lastPlayed' ? e.lastPlayed : key === 'percent' ? e.pct : e.title)
  return [...entries].sort((a, b) => compareSortValues(value(a), value(b), dir))
}
