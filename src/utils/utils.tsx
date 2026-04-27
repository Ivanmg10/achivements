import { ragamesIds } from '@/constants/ragamesidpool'
import { RecentAchievement, RetroAchievementsGameCompleted } from '@/types/types'

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
