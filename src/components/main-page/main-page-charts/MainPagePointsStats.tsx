import { RecentAchievement, UserRankAndScore } from '@/types/types'
import { calcStreak } from '@/utils/utils'
import { StatPill } from '@/components/ui/StatPill'

export default function MainPagePointsStats({
  achievements,
  heatmapAchievements,
  rank,
  isLoading,
}: {
  achievements: RecentAchievement[]
  heatmapAchievements: RecentAchievement[]
  rank: UserRankAndScore | null
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        {['Today', 'This week', 'HC this week', 'SC this week', 'Global rank', 'Streak'].map((label) => (
          <StatPill key={label} label={label} value="—" accent="text-text-secondary" />
        ))}
      </div>
    )
  }

  const safeList = Array.isArray(achievements) ? achievements : []
  const now = new Date()
  const todayKey = now.toISOString().split('T')[0]
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)

  let ptsToday = 0, achToday = 0
  let pts7d = 0, hc7d = 0, sc7d = 0, ach7d = 0

  for (const a of safeList) {
    const d = new Date(a.Date)
    const hc = a.HardcoreMode === '1'
    if (a.Date.startsWith(todayKey)) { ptsToday += a.Points; achToday++ }
    if (d >= weekAgo) {
      pts7d += a.Points; ach7d++
      if (hc) hc7d += a.Points; else sc7d += a.Points
    }
  }

  const streak = calcStreak(heatmapAchievements)
  const todaySub = ptsToday === 0 ? 'no activity' : `${achToday} achievement${achToday !== 1 ? 's' : ''}`

  return (
    <div className="flex flex-wrap gap-3">
      <StatPill label="Today" value={ptsToday.toLocaleString()} sub={todaySub} accent={ptsToday > 0 ? 'text-warning' : undefined} />
      <StatPill label="This week" value={pts7d.toLocaleString()} sub={`${ach7d} achievement${ach7d !== 1 ? 's' : ''}`} />
      <StatPill label="HC this week" value={hc7d.toLocaleString()} sub="hardcore pts" accent={hc7d > 0 ? 'text-warning' : undefined} />
      <StatPill label="SC this week" value={sc7d.toLocaleString()} sub="softcore pts" accent={sc7d > 0 ? 'text-info' : undefined} />
      {rank && <StatPill label="Global rank" value={`#${rank.Rank.toLocaleString()}`} sub={`${rank.Score.toLocaleString()} pts`} accent="text-accent" />}
      <StatPill label="Streak" value={`${streak}d`} sub={streak > 0 ? 'active' : 'no streak'} accent={streak >= 7 ? 'text-warning' : streak > 0 ? 'text-success' : undefined} href="/racha" />
    </div>
  )
}
