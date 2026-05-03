import { RecentAchievement, UserRankAndScore } from '@/types/types'

function pill(label: string, value: string, sub?: string, accent?: string) {
  return (
    <div className="bg-bg-main rounded-xl px-5 py-3 flex flex-col gap-0.5 flex-1 min-w-30">
      <span className="text-[10px] uppercase tracking-widest text-text-secondary">{label}</span>
      <span className={`text-2xl font-bold ${accent ?? 'text-text-main'}`}>{value}</span>
      {sub && <span className="text-xs text-text-secondary">{sub}</span>}
    </div>
  )
}

function calcStreak(achievements: RecentAchievement[]): number {
  const days = new Set(achievements.map((a) => a.Date.split(' ')[0]))
  const today = new Date()
  let streak = 0
  for (let i = 0; i <= 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) {
      streak++
    } else if (i === 0) {
      continue
    } else {
      break
    }
  }
  return streak
}

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
          <div key={label} className="bg-bg-main rounded-xl px-5 py-3 flex flex-col gap-0.5 flex-1 min-w-30">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary">{label}</span>
            <span className="text-2xl font-bold text-text-secondary">—</span>
          </div>
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
      {pill('Today', ptsToday.toLocaleString(), todaySub, ptsToday > 0 ? 'text-yellow-400' : undefined)}
      {pill('This week', pts7d.toLocaleString(), `${ach7d} achievement${ach7d !== 1 ? 's' : ''}`)}
      {pill('HC this week', hc7d.toLocaleString(), 'hardcore pts', hc7d > 0 ? 'text-yellow-400' : undefined)}
      {pill('SC this week', sc7d.toLocaleString(), 'softcore pts', sc7d > 0 ? 'text-blue-400' : undefined)}
      {rank && pill('Global rank', `#${rank.Rank.toLocaleString()}`, `${rank.Score.toLocaleString()} pts`, 'text-accent')}
      {pill('Streak', `${streak}d`, streak > 0 ? 'active' : 'no streak', streak >= 7 ? 'text-orange-400' : streak > 0 ? 'text-green-400' : undefined)}
    </div>
  )
}
