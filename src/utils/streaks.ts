import type { RecentAchievement, Streak } from '@/types/types'
import { dayIn, unlockDay } from '@/utils/dates'

/**
 * Every run of consecutive days with an unlock, the longest first. Days are the person's own calendar:
 * the browser's zone, or `timeZone` on the server (see `dayIn`).
 */
export function calcAllStreaks(achievements: RecentAchievement[], timeZone?: string): Streak[] {
  const dated = achievements.map((a) => ({ a, day: unlockDay(a.Date, timeZone) })).filter((x) => x.day)
  if (!dated.length) return []
  const uniqueDays = [...new Set(dated.map((x) => x.day))].sort()
  const streaks: Streak[] = []
  let start = uniqueDays[0]
  let prev = uniqueDays[0]

  const makeStreak = (s: string, e: string): Streak => {
    const days = Math.round((Date.parse(`${e}T00:00:00Z`) - Date.parse(`${s}T00:00:00Z`)) / 86400000) + 1
    return {
      start: s,
      end: e,
      days,
      achievements: dated.filter((x) => x.day >= s && x.day <= e).map((x) => x.a),
    }
  }

  for (let i = 1; i < uniqueDays.length; i++) {
    const curr = uniqueDays[i]
    const diff = Math.round((Date.parse(`${curr}T00:00:00Z`) - Date.parse(`${prev}T00:00:00Z`)) / 86400000)
    if (diff === 1) {
      prev = curr
    } else {
      streaks.push(makeStreak(start, prev))
      start = curr
      prev = curr
    }
  }
  streaks.push(makeStreak(start, prev))
  return streaks.sort((a, b) => b.days - a.days)
}

/** The streak still alive at `now`: one that ended today or yesterday, on the same calendar as `calcAllStreaks`. */
export function activeStreak<S extends Pick<Streak, 'end'>>(streaks: S[], now: number, timeZone?: string): S | null {
  const today = dayIn(now, timeZone)
  const yesterday = dayIn(Date.parse(`${today}T12:00:00Z`) - 86400000, 'UTC')
  return streaks.find(s => s.end === today || s.end === yesterday) ?? null
}

/** A streak without its unlocks: what the header needs, a few bytes instead of a year. */
export type StreakSpan = { start: string; end: string; days: number }

export type StreakSummary = { active: StreakSpan | null; best: StreakSpan | null }

const span = (s: Streak | null): StreakSpan | null => (s ? { start: s.start, end: s.end, days: s.days } : null)

/** The current and the best streak of a year of unlocks, the same numbers the streak page counts, on `timeZone`'s calendar. */
export function streakSummary(achievements: RecentAchievement[], now: number, timeZone?: string): StreakSummary {
  const streaks = calcAllStreaks(achievements, timeZone)
  return { active: span(activeStreak(streaks, now, timeZone)), best: span(streaks[0] ?? null) }
}
