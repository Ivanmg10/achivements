import type { RecentAchievement, Streak } from '@/types/types'

/** Every run of consecutive days with an unlock, the longest first. Days are the unlocks' own (`YYYY-MM-DD …`). */
export function calcAllStreaks(achievements: RecentAchievement[]): Streak[] {
  if (!achievements.length) return []
  const uniqueDays = [...new Set(achievements.map(a => a.Date.split(' ')[0]))].sort()
  const streaks: Streak[] = []
  let start = uniqueDays[0]
  let prev = uniqueDays[0]

  const makeStreak = (s: string, e: string): Streak => {
    const days = Math.round((new Date(e + 'T00:00:00').getTime() - new Date(s + 'T00:00:00').getTime()) / 86400000) + 1
    return {
      start: s,
      end: e,
      days,
      achievements: achievements.filter(a => { const d = a.Date.split(' ')[0]; return d >= s && d <= e }),
    }
  }

  for (let i = 1; i < uniqueDays.length; i++) {
    const curr = uniqueDays[i]
    const diff = Math.round((new Date(curr + 'T00:00:00').getTime() - new Date(prev + 'T00:00:00').getTime()) / 86400000)
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

/** The streak still alive at `now`: one that ended today or yesterday (UTC days, as the unlocks'). */
export function activeStreak<S extends Pick<Streak, 'end'>>(streaks: S[], now: number): S | null {
  const today = new Date(now).toISOString().split('T')[0]
  const yesterday = new Date(now - 86400000).toISOString().split('T')[0]
  return streaks.find(s => s.end === today || s.end === yesterday) ?? null
}

/** A streak without its unlocks: what the header needs, a few bytes instead of a year. */
export type StreakSpan = { start: string; end: string; days: number }

export type StreakSummary = { active: StreakSpan | null; best: StreakSpan | null }

const span = (s: Streak | null): StreakSpan | null => (s ? { start: s.start, end: s.end, days: s.days } : null)

/** The current and the best streak of a year of unlocks, the same numbers the streak page counts. */
export function streakSummary(achievements: RecentAchievement[], now: number): StreakSummary {
  const streaks = calcAllStreaks(achievements)
  return { active: span(activeStreak(streaks, now)), best: span(streaks[0] ?? null) }
}
