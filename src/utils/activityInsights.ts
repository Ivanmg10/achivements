import type { RecentAchievement } from '@/types/types'
import type { GameSource } from '@/types/steam'

/**
 * What the Activity section reads from the year of unlocks the streak already
 * loads (every platform, hidden consoles left out): when the person plays,
 * this month against the last, and a diary of the last days.
 *
 * Unlock dates come as UTC ("2026-10-17 18:30:00", every platform alike), so
 * each is read back as UTC and then counted in the browser's own time: an
 * unlock at 20:00 in Madrid is an evening, not 18:00.
 */

/** The moment of an unlock. */
export function unlockTime(a: Pick<RecentAchievement, 'Date'>): Date {
  return new Date(`${a.Date.replace(' ', 'T')}Z`)
}

/** "2026-10-17", in local time. */
export function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Monday 0 … Sunday 6. */
const weekday = (d: Date) => (d.getDay() + 6) % 7

export type Habits = {
  total: number
  /** Unlocks per weekday, Monday first, and per hour of the day. */
  byDay: number[]
  byHour: number[]
  /** The busiest weekday and three-hour stretch, or null with no unlocks. */
  peak: { day: number; fromHour: number } | null
}

/** When the person unlocks things, by weekday and hour of the day. */
export function playHabits(achievements: Pick<RecentAchievement, 'Date'>[]): Habits {
  const byDay = Array<number>(7).fill(0)
  const byHour = Array<number>(24).fill(0)
  for (const a of achievements) {
    const d = unlockTime(a)
    if (Number.isNaN(d.getTime())) continue
    byDay[weekday(d)]++
    byHour[d.getHours()]++
  }
  const total = byDay.reduce((n, c) => n + c, 0)
  if (total === 0) return { total, byDay, byHour, peak: null }

  const day = byDay.indexOf(Math.max(...byDay))
  // The busiest stretch of three hours, over the whole week: one lucky hour says little.
  const stretch = (h: number) => [0, 1, 2].reduce((n, i) => n + byHour[(h + i) % 24], 0)
  let fromHour = 0
  for (let h = 1; h < 24; h++) if (stretch(h) > stretch(fromHour)) fromHour = h
  return { total, byDay, byHour, peak: { day, fromHour } }
}

export type MonthNumbers = { unlocks: number; games: number; days: number }
export type MonthCompare = {
  current: MonthNumbers
  previous: MonthNumbers
  /** How many days of each month are compared: today's date, capped at the length of last month. */
  throughDay: number
  /** The first of last month, local midnight. */
  previousMonth: Date
}

/**
 * This month so far against the same days of last month: on the 17th, the 1st
 * to the 17th of each, so half a month is not measured against a whole one.
 */
export function compareMonths(achievements: RecentAchievement[], now: Date): MonthCompare {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastOfPrevious = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  const throughDay = Math.min(now.getDate(), lastOfPrevious)
  const previousEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), throughDay + 1)

  const count = (from: Date, to: Date): MonthNumbers => {
    const inRange = achievements.filter((a) => {
      const d = unlockTime(a)
      return d >= from && d < to
    })
    return {
      unlocks: inRange.length,
      games: new Set(inRange.map((a) => `${a.Source ?? 'ra'}:${a.GameID}`)).size,
      days: new Set(inRange.map((a) => localDay(unlockTime(a)))).size,
    }
  }
  return { current: count(start, now), previous: count(previousMonth, previousEnd), throughDay, previousMonth }
}

export type JournalGame = {
  source: GameSource
  gameId: number
  title: string
  console: string
  /** The unlock, to draw the game's icon from. */
  sample: RecentAchievement
  count: number
}
export type JournalDay = { day: string; total: number; games: JournalGame[] }

/** The last days with unlocks, newest first, each with its games, busiest first. */
export function activityJournal(achievements: RecentAchievement[], days: number): JournalDay[] {
  const byDay = new Map<string, Map<string, JournalGame>>()
  for (const a of achievements) {
    const d = unlockTime(a)
    if (Number.isNaN(d.getTime())) continue
    const day = localDay(d)
    const games = byDay.get(day) ?? new Map<string, JournalGame>()
    const source = a.Source ?? 'ra'
    const key = `${source}:${a.GameID}`
    const game = games.get(key) ?? { source, gameId: a.GameID, title: a.GameTitle, console: a.ConsoleName, sample: a, count: 0 }
    game.count++
    games.set(key, game)
    byDay.set(day, games)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, days)
    .map(([day, games]) => {
      const list = [...games.values()].sort((a, b) => b.count - a.count)
      return { day, total: list.reduce((n, g) => n + g.count, 0), games: list }
    })
}
