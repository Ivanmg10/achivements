import type { RecentAchievement } from '@/types/types'
import type { GameSource } from '@/types/game'
import { achievementGameIconUrl } from '@/utils/utils'
import { gameKey } from '@/utils/gameRef'

/** One game's unlocks inside a day: shown once with its cover, title and platform. */
export type GameGroup = {
  key: string
  source: GameSource
  gameId: number
  title: string
  /** The platform's own name for it where there is one (RA's console), else empty. */
  console: string
  image?: string
  /** Newest first. */
  achievements: RecentAchievement[]
}

export type DayGroup = {
  /** "YYYY-MM-DD", as the unlocks carry it. */
  date: string
  count: number
  /** RA's points of the day; meaningful only when `hasPoints`. */
  points: number
  hasPoints: boolean
  /** The game with the day's latest unlock first. */
  games: GameGroup[]
}

const sourceOf = (a: RecentAchievement): GameSource => a.Source ?? 'ra'

/** The calendar day of an unlock ("2024-01-15 20:30:00" → "2024-01-15"). */
export const dayOf = (a: RecentAchievement) => a.Date.split(' ')[0]

/** Points are RA's only: a list that mixes platforms shows counts, never a total that leaves rows out. */
export const allRa = (achievements: RecentAchievement[]) => achievements.every((a) => sourceOf(a) === 'ra')

/** Unlocks of one day grouped by game, the game of the latest unlock first and each game's unlocks newest first. */
export function groupGames(achievements: RecentAchievement[]): GameGroup[] {
  const byGame = new Map<string, GameGroup>()
  for (const a of [...achievements].sort((x, y) => y.Date.localeCompare(x.Date))) {
    const source = sourceOf(a)
    const key = gameKey(source, a.GameID)
    const group = byGame.get(key) ?? { key, source, gameId: a.GameID, title: a.GameTitle, console: source === 'ra' ? a.ConsoleName : '', achievements: [] }
    group.image ??= achievementGameIconUrl(a)
    group.achievements.push(a)
    byGame.set(key, group)
  }
  return [...byGame.values()]
}

/** Unlocks grouped by day (newest day first), then by game: what the week, month and day dialogs read. */
export function groupDays(achievements: RecentAchievement[]): DayGroup[] {
  const byDay = new Map<string, RecentAchievement[]>()
  for (const a of achievements) byDay.set(dayOf(a), [...(byDay.get(dayOf(a)) ?? []), a])
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      count: list.length,
      points: list.reduce((sum, a) => sum + a.Points, 0),
      hasPoints: allRa(list),
      games: groupGames(list),
    }))
}
