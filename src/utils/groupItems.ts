import { gameKey } from '@/utils/gameRef'
import type { GameGroupItem, RecentlyPlayedGame, RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'

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

/** Steam progress straight from the library, live, by appid. */
export function steamProgressMap(library: SteamGameProgress[]): Map<number, Counts> {
  const map = new Map<number, Counts>()
  for (const g of library) if (g.achievementsLoaded && g.maxPossible > 0) map.set(g.id, { earned: g.numAwarded, total: g.maxPossible })
  return map
}

/** Completion 0–1: Steam live from the library, RA from the stored fraction. */
export function itemPct(item: GameGroupItem, steam: Map<number, Counts>): number {
  const live = isRa(item) ? undefined : steam.get(item.game_id)
  return live ? live.earned / live.total : parseFloat(item.pct_won) || 0
}

export function filterGroupItems(items: GameGroupItem[], filters: GroupFilters, steam: Map<number, Counts>): GameGroupItem[] {
  return items.filter((item) => {
    if (filters.consoles.size > 0 && (!item.console_name || !filters.consoles.has(item.console_name))) return false
    const pct = itemPct(item, steam)
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
 * from the freshest numbers there are (live RA progress, the Steam library),
 * falling back to the counts stored on the item.
 */
export function groupSummary(items: GameGroupItem[], ra: Map<number, AchStats>, steam: Map<number, Counts>): Counts {
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
      const live = steam.get(item.game_id)
      if (live) {
        earned += live.earned
        total += live.total
        continue
      }
    }
    earned += item.num_awarded
    total += item.max_possible
  }
  return { earned, total }
}
