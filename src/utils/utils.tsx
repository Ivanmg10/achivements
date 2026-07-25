import { ragamesIds } from '@/constants/ragamesidpool'
import { RecentAchievement, RetroAchievement, RetroAchievementsGameCompleted, Streak } from '@/types/types'
import { CategoryGame } from '@/hooks/useGamesByCategory'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'
import { StatusSortKey, SortDir } from '@/components/status-sort-control/StatusSortControl'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const t = new Date(dateStr).getTime()
  if (isNaN(t)) return '—'
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  if (months < 12) return `${months}mo ago`
  return `${years}y ago`
}

export function getRandomGameIds(count: number = 5): string[] {
  const shuffled = [...ragamesIds].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const groupByDay = (achievements: RecentAchievement[]) => {
  const last7Days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Days.push(d.toISOString().split('T')[0])
  }

  if (!Array.isArray(achievements)) return last7Days.map((date) => ({ date, count: 0 }))

  const grouped = achievements.reduce(
    (acc, a) => {
      const day = a.Date.split(' ')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return last7Days.map((date) => ({ date, count: grouped[date] || 0 }))
}

export const groupByConsole = (games: RetroAchievementsGameCompleted[]) => {
  const grouped = games
    .filter((game) => game.ConsoleName !== 'Events')
    .reduce(
      (acc, game) => {
        acc[game.ConsoleName] = (acc[game.ConsoleName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

  return Object.entries(grouped).map(([name, value]) => ({ name, value }))
}

export const groupByDays = (achievements: RecentAchievement[], totalDays: number) => {
  const days: string[] = []
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  const grouped = achievements.reduce((acc, a) => {
    const day = a.Date.split(' ')[0]
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  return days.map((date) => ({ date, count: grouped[date] || 0 }))
}

export const groupBy365Days = (achievements: RecentAchievement[]) => groupByDays(achievements, 365)

export function calcStreak(achievements: RecentAchievement[]): number {
  if (!achievements.length) return 0
  const days = new Set(achievements.map((a) => a.Date.split(' ')[0]))
  let count = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) count++
    else if (i > 0) break
  }
  return count
}

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

export function getGameSortValue(
  game: CategoryGame,
  extra: GameExtraData | undefined,
  key: StatusSortKey,
): string | number | null {
  const isWantToPlay = 'PointsTotal' in game

  switch (key) {
    case 'name':
      return game.Title
    case 'lastPlayed':
      return isWantToPlay ? null : (extra?.lastPlayed ?? null)
    case 'percent':
      return isWantToPlay ? null : (parseFloat((game as RetroAchievementsGameCompleted).PctWon) || 0) * 100
    case 'points':
      if (isWantToPlay) return game.PointsTotal
      if (extra?.possibleScore == null) return null
      return extra.scoreAchievedHardcore || extra.scoreAchieved || 0
  }
}

export function compareSortValues(
  a: string | number | null,
  b: string | number | null,
  dir: SortDir,
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  const cmp = typeof a === 'string' || typeof b === 'string'
    ? String(a).localeCompare(String(b))
    : a - b
  return dir === 'asc' ? cmp : -cmp
}

export function applyCustomOrder(
  perfects: RetroAchievementsGameCompleted[],
  savedOrder: number[],
): RetroAchievementsGameCompleted[] {
  const byId = new Map(perfects.map((g) => [g.GameID, g]))
  const ordered: RetroAchievementsGameCompleted[] = []
  const seen = new Set<number>()

  for (const id of savedOrder) {
    const g = byId.get(id)
    if (g) {
      ordered.push(g)
      seen.add(id)
    }
  }

  const rest = perfects
    .filter((g) => !seen.has(g.GameID))
    .sort((a, b) => a.Title.localeCompare(b.Title))

  return [...ordered, ...rest]
}

export function sumAchievementPoints(
  achievements: Record<string, RetroAchievement | undefined | null>,
  hardcoreOnly = false,
): { earned: number; total: number } {
  let earned = 0
  let total = 0
  for (const a of Object.values(achievements)) {
    if (!a) continue
    total += a.Points
    const isEarned = hardcoreOnly ? !!a.DateEarnedHardcore : !!(a.DateEarned || a.DateEarnedHardcore)
    if (isEarned) earned += a.Points
  }
  return { earned, total }
}
