import type { CategoryGame } from '@/hooks/useGamesByCategory'
import type { GameExtraData } from '@/components/statusGameList/StatusGameList'
import type { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { XboxGameProgress } from '@/types/xbox'
import type { StatusSortKey, StatusSortState } from '@/components/status-sort-control/StatusSortControl'
import { compareSortValues } from '@/utils/utils'
import { raLatestCompletionAward, validCompletionDate } from '@/utils/completionDates'
import { classifySteamGame } from '@/utils/steamFeed'
import { classifyPsnGame } from '@/utils/psnTitles'
import { classifyXboxGame } from '@/utils/xboxTitles'
import { raGameId } from '@/utils/gameRef'
import type { GameStatus } from '@/types/game'

/** A page's quick filters: "almost" and "stalled" in progress; on "all" (every status) the statuses themselves. */
export type QuickFilter = 'all' | 'almost' | 'stalled' | GameStatus

/** The orders every platform can be sorted by: points are RA's alone, so the mixed list does not offer them. */
export const MIXED_SORT_KEYS = ['name', 'lastPlayed', 'percent'] as const
/** The orders of a mixed list: a completed one can also go by when each game was completed. */
export const mixedSortKeys = (category: string): StatusSortKey[] => (category === 'completed' ? ['name', 'completed', 'lastPlayed', 'percent'] : [...MIXED_SORT_KEYS])
const QUICK_BY_CATEGORY: Record<string, readonly QuickFilter[]> = {
  playing: ['all', 'almost', 'stalled'],
  all: ['all', 'playing', 'completed', 'wantToPlay'],
}
/** The quick filters a page offers, in order; none for a page that has nothing to narrow by. */
export const quickFiltersFor = (category: string): readonly QuickFilter[] => QUICK_BY_CATEGORY[category] ?? []

/** From this progress (and below 100) a game is "almost done". */
export const ALMOST_PCT = 80
/** Untouched for this long, an unfinished game is "stalled". */
export const STALLED_DAYS = 90
const DAY = 86_400_000

/** What the quick filters need from a game of any platform. */
export type Progress = { pct: number | null; lastPlayed: string | null; status?: GameStatus }
/** A game of a platform, where it stands too. */
export type StatusProgress = Progress & { status: GameStatus }

export function matchesQuick({ pct, lastPlayed, status }: Progress, quick: QuickFilter, now = Date.now()): boolean {
  if (quick === 'all') return true
  if (quick === 'playing' || quick === 'completed' || quick === 'wantToPlay') return status === quick
  if (quick === 'almost') return pct !== null && pct >= ALMOST_PCT && pct < 100
  // No date, no verdict: a game whose last session is unknown is never called stalled.
  const t = lastPlayed ? Date.parse(lastPlayed) : NaN
  return !Number.isNaN(t) && now - t > STALLED_DAYS * DAY
}

const ALL_QUICK: readonly QuickFilter[] = ['all', 'almost', 'stalled', 'playing', 'completed', 'wantToPlay']

export function countQuick(items: Progress[], now = Date.now()): Record<QuickFilter, number> {
  return Object.fromEntries(ALL_QUICK.map((q) => [q, items.filter((p) => matchesQuick(p, q, now)).length])) as Record<QuickFilter, number>
}

export const raProgress = (g: CategoryGame, extra?: GameExtraData): StatusProgress => {
  // RA's want-to-play list has no progress; a game it reports progress for is started, done at 100 %.
  const won = 'PctWon' in g ? parseFloat((g as RetroAchievementsGameCompleted).PctWon) : null
  const status: GameStatus = won === null ? 'wantToPlay' : won >= 1 ? 'completed' : 'playing'
  return { pct: won === null ? null : Math.round(won * 100), lastPlayed: extra?.lastPlayed ?? null, status }
}
// A Steam game listed has known counts (its lists leave out the rest), so its status is never null here.
export const steamProgress = (g: SteamGameProgress): StatusProgress => ({ pct: g.pctWon, lastPlayed: g.lastPlayed, status: classifySteamGame(g) ?? 'playing' })
export const psnProgress = (g: PsnGameProgress): StatusProgress => ({ pct: g.pctWon, lastPlayed: g.lastPlayed ?? g.lastTrophyAt, status: classifyPsnGame(g) })
export const xboxProgress = (g: XboxGameProgress): StatusProgress => ({ pct: g.pctWon, lastPlayed: g.lastPlayed, status: classifyXboxGame(g) })

/** One game of any platform in the mixed list, with what the common sort reads. */
export type LibraryEntry = StatusProgress & { key: string; title: string; completedAt?: string | null } & (
  | { kind: 'ra'; game: CategoryGame; extra?: GameExtraData }
  | { kind: 'steam'; game: SteamGameProgress }
  | { kind: 'psn'; game: PsnGameProgress }
  | { kind: 'xbox'; game: XboxGameProgress }
)

export function buildEntries(
  ra: CategoryGame[],
  extra: Map<number, GameExtraData>,
  steam: SteamGameProgress[],
  psn: PsnGameProgress[],
  xbox: XboxGameProgress[] = [],
): LibraryEntry[] {
  return [
    ...ra.map((game): LibraryEntry => {
      const e = extra.get(raGameId(game))
      return { kind: 'ra', key: `ra:${raGameId(game)}`, title: game.Title, game, extra: e, completedAt: e ? raLatestCompletionAward(e.awards, raGameId(game)) : null, ...raProgress(game, e) }
    }),
    ...steam.map((game): LibraryEntry => ({ kind: 'steam', key: `steam:${game.id}`, title: game.title, game, completedAt: classifySteamGame(game) === 'completed' ? validCompletionDate(game.lastUnlock) : null, ...steamProgress(game) })),
    ...psn.map((game): LibraryEntry => ({ kind: 'psn', key: `psn:${game.id}`, title: game.title, game, completedAt: game.completedAt ?? null, ...psnProgress(game) })),
    ...xbox.map((game): LibraryEntry => ({ kind: 'xbox', key: `xbox:${game.id}`, title: game.title, game, completedAt: game.completedAt ?? null, ...xboxProgress(game) })),
  ]
}

/** The mixed list's order. "points" is RA's alone, so it is not offered here. */
export function sortEntries(entries: LibraryEntry[], { key, dir }: StatusSortState): LibraryEntry[] {
  const value = (e: LibraryEntry) => (key === 'lastPlayed' ? e.lastPlayed : key === 'completed' ? e.completedAt ?? null : key === 'percent' ? e.pct : e.title)
  return [...entries].sort((a, b) => compareSortValues(value(a), value(b), dir))
}
