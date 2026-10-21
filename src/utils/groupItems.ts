import { gameKey } from '@/utils/gameRef'
import type { GameGroupItem, RecentlyPlayedGame, RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { XboxGameProgress } from '@/types/xbox'
import { xboxHasAchievements } from '@/utils/xboxTitles'

export type PctFilter = 'all' | '0' | 'progress' | '100'
export type DecadeFilter = 'all' | '80s' | '90s' | '00s' | '10s' | '20s'
export const DECADES: Exclude<DecadeFilter, 'all'>[] = ['80s', '90s', '00s', '10s', '20s']

export type AchStats = { scEarned: number; hcEarned: number; total: number }
export type PtsStats = { earned: number; total: number }
export type Counts = { earned: number; total: number }
export type GroupFilters = { consoles: Set<string>; pct: PctFilter; decade: DecadeFilter }

/** Rows from before Steam have no source; they are RA games. */
export function itemKey(item: GameGroupItem): string {
  return gameKey(item.source ?? 'ra', item.game_id)
}

export function isRa(item: GameGroupItem): boolean {
  return (item.source ?? 'ra') === 'ra'
}

export function getDecade(year: number): Exclude<DecadeFilter, 'all'> {
  if (year < 1990) return '80s'
  if (year < 2000) return '90s'
  if (year < 2010) return '00s'
  if (year < 2020) return '10s'
  return '20s'
}

/**
 * The best RA progress known for each game, across the recently played feed
 * (fresh, per mode) and the completed/in-progress list: achievements in each
 * mode, points, and when it was last played.
 */
export function raProgressMaps(recentlyPlayed: RecentlyPlayedGame[], allGames: RetroAchievementsGameCompleted[]) {
  const hc = new Map<number, number>()
  const sc = new Map<number, number>()
  const total = new Map<number, number>()
  const pts = new Map<number, PtsStats>()
  const lastPlayed = new Map<number, string>()
  const raise = (m: Map<number, number>, id: number, n: number) => {
    if (n > (m.get(id) ?? 0)) m.set(id, n)
  }

  for (const g of recentlyPlayed) {
    total.set(g.GameID, g.NumPossibleAchievements)
    raise(hc, g.GameID, g.NumAchievedHardcore)
    raise(sc, g.GameID, g.NumAchieved)
    pts.set(g.GameID, { earned: g.ScoreAchievedHardcore || g.ScoreAchieved, total: g.PossibleScore })
    lastPlayed.set(g.GameID, g.LastPlayed)
  }
  for (const g of allGames) {
    raise(total, g.GameID, g.MaxPossible)
    raise(Number(g.HardcoreMode) === 1 ? hc : sc, g.GameID, g.NumAwarded)
  }

  const ach = new Map<number, AchStats>()
  for (const id of new Set([...hc.keys(), ...sc.keys()])) {
    ach.set(id, { scEarned: sc.get(id) ?? 0, hcEarned: hc.get(id) ?? 0, total: total.get(id) ?? 0 })
  }
  return { ach, pts, lastPlayed }
}

/** Live progress (counts, and completion 0–1) by game key. */
export type LiveProgress = Map<string, Counts & { pct: number }>

/**
 * Steam and PSN progress straight from their libraries, live, keyed by
 * "steam:620" / "psn:2018800": the two number spaces overlap, so a bare id
 * would let a PSN game read a Steam app's numbers. PSN's completion is
 * Sony's own (it weighs trophies by grade).
 */
export function liveProgressMap(steam: SteamGameProgress[], psn: PsnGameProgress[] = [], xbox: XboxGameProgress[] = []): LiveProgress {
  const map: LiveProgress = new Map()
  for (const g of steam) {
    if (g.achievementsLoaded && g.maxPossible > 0) {
      map.set(gameKey('steam', g.id), { earned: g.numAwarded, total: g.maxPossible, pct: g.numAwarded / g.maxPossible })
    }
  }
  for (const g of psn) {
    if (g.maxPossible > 0) map.set(gameKey('psn', g.id), { earned: g.numAwarded, total: g.maxPossible, pct: g.pctWon / 100 })
  }
  // Xbox's completion is by gamerscore. A modern game's achievement total can be unknown (0): its completion is still live, its counts are not (see groupSummary).
  for (const g of xbox) {
    if (xboxHasAchievements(g)) map.set(gameKey('xbox', g.id), { earned: g.numAwarded, total: g.maxPossible, pct: g.pctWon / 100 })
  }
  return map
}

export type ItemProgress = Counts & {
  /** Completion 0–1, the best of either mode for RA. */
  pct: number
  /** RA's hardcore share 0–1, when RA's live numbers are known. */
  hard?: number
}

/**
 * How far along one game of the group is, from the freshest numbers there are:
 * RA's live progress, the Steam/PSN/Xbox libraries, or what the item stored.
 */
export function itemProgress(item: GameGroupItem, live: LiveProgress, ra: Map<number, AchStats> = new Map()): ItemProgress {
  if (isRa(item)) {
    const a = ra.get(item.game_id)
    if (a && a.total > 0) {
      const earned = Math.max(a.hcEarned, a.scEarned)
      return { earned, total: a.total, pct: Math.min(1, earned / a.total), hard: Math.min(1, a.hcEarned / a.total) }
    }
  } else {
    const now = live.get(itemKey(item))
    if (now) return now
  }
  return { earned: item.num_awarded, total: item.max_possible, pct: parseFloat(item.pct_won) || 0 }
}

/** Completion 0–1 (see itemProgress); without `ra`, RA's is the stored fraction. */
export function itemPct(item: GameGroupItem, live: LiveProgress, ra?: Map<number, AchStats>): number {
  return itemProgress(item, live, ra).pct
}

/** How many of the games are finished, started and not started. */
export function groupStateCounts(items: GameGroupItem[], live: LiveProgress, ra?: Map<number, AchStats>) {
  const counts = { done: 0, started: 0, notStarted: 0 }
  for (const item of items) {
    const pct = itemPct(item, live, ra)
    if (pct >= 1) counts.done++
    else if (pct > 0) counts.started++
    else counts.notStarted++
  }
  return counts
}

export function filterGroupItems(items: GameGroupItem[], filters: GroupFilters, live: LiveProgress, ra?: Map<number, AchStats>): GameGroupItem[] {
  return items.filter((item) => {
    if (filters.consoles.size > 0 && (!item.console_name || !filters.consoles.has(item.console_name))) return false
    const pct = itemPct(item, live, ra)
    if (filters.pct === '0' && pct !== 0) return false
    if (filters.pct === 'progress' && !(pct > 0 && pct < 1)) return false
    if (filters.pct === '100' && pct < 1) return false
    if (filters.decade !== 'all') {
      const year = item.release_year
      if (!year || getDecade(year) !== filters.decade) return false
    }
    return true
  })
}

/**
 * The whole group's achievements, earned and total: each game counted once,
 * from the freshest numbers there are (live RA progress, the Steam and PSN
 * libraries), falling back to the counts stored on the item.
 */
export function groupSummary(items: GameGroupItem[], ra: Map<number, AchStats>, live: LiveProgress): Counts {
  let earned = 0
  let total = 0
  for (const item of items) {
    if (isRa(item)) {
      const live = ra.get(item.game_id)
      if (live && live.total > 0) {
        earned += Math.max(live.hcEarned, live.scEarned)
        total += live.total
        continue
      }
    } else {
      const now = live.get(itemKey(item))
      // A live entry with no total (an Xbox game whose count Xbox does not say) has no counts to give.
      if (now && now.total > 0) {
        earned += now.earned
        total += now.total
        continue
      }
    }
    earned += item.num_awarded
    total += item.max_possible
  }
  return { earned, total }
}
