'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement, UserRankAndScore } from '@/types/types'
import { calcStreak, calcAvgPerDay, calcThisMonth } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import { StatPill } from '@/components/ui/StatPill'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import PeriodAchievementsModal from '@/components/period-achievements-modal/PeriodAchievementsModal'

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
  const { T } = useLanguage()

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, T.userStats.globalRank, T.streak.title].map((label) => (
          <StatPill key={label} label={label} value="—" accent="text-text-secondary" />
        ))}
      </div>
    )
  }

  const safeList = Array.isArray(achievements) ? achievements : []
  const safeHeatmap = Array.isArray(heatmapAchievements) ? heatmapAchievements : []
  const now = new Date()
  const todayKey = now.toISOString().split('T')[0]
  const monthKey = now.toISOString().slice(0, 7)
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)

  let ptsToday = 0, achToday = 0
  const weekAchievements: RecentAchievement[] = []

  for (const a of safeList) {
    const d = new Date(a.Date.replace(' ', 'T'))
    if (a.Date.startsWith(todayKey)) { ptsToday += a.Points; achToday++ }
    if (d >= weekAgo) weekAchievements.push(a)
  }

  const pts7d = weekAchievements.reduce((s, a) => s + a.Points, 0)
  const monthAchievements = safeHeatmap.filter((a) => a.Date.slice(0, 7) === monthKey)
  const streak = calcStreak(heatmapAchievements)
  const thisMonth = calcThisMonth(safeHeatmap)
  const avgPerDay = calcAvgPerDay(safeHeatmap, 30)
  const todaySub = ptsToday === 0 ? T.pointsStats.noActivity : `${achToday} ${T.lineChart.achievements}`

  return (
    <div className="flex flex-wrap gap-3">
      <StatPill label={T.pointsStats.today} value={ptsToday.toLocaleString()} sub={todaySub} accent="text-purple-400" onClick={() => setSelectedDay(todayKey)} />
      <StatPill label={T.pointsStats.thisWeek} value={pts7d.toLocaleString()} sub={`${weekAchievements.length} ${T.lineChart.achievements}`} accent="text-yellow-400" onClick={() => setWeekOpen(true)} />
      <StatPill label={T.pointsStats.thisMonth} value={thisMonth.pts.toLocaleString()} sub={`${thisMonth.ach} ${T.lineChart.achievements}`} accent="text-red-400" onClick={() => setMonthOpen(true)} />
      <StatPill label={T.pointsStats.avgPerDay} value={avgPerDay.toFixed(1)} sub={T.pointsStats.perDay} accent="text-info" />
      {rank?.Rank != null && <StatPill label={T.userStats.globalRank} value={`#${rank.Rank.toLocaleString()}`} sub={`${(rank.Score ?? 0).toLocaleString()} pts`} accent="text-accent" />}
      <StatPill label={T.streak.title} value={`${streak}d`} sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak} accent={streak >= 7 ? 'text-warning' : streak > 0 ? 'text-success' : undefined} href="/racha" />

      <AnimatePresence>
        {selectedDay && (
          <DayAchievementsModal date={selectedDay} achievements={safeList} onClose={() => setSelectedDay(null)} />
        )}
        {weekOpen && (
          <PeriodAchievementsModal title={T.pointsStats.thisWeek} achievements={weekAchievements} onClose={() => setWeekOpen(false)} />
        )}
        {monthOpen && (
          <PeriodAchievementsModal title={T.pointsStats.thisMonth} achievements={monthAchievements} onClose={() => setMonthOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
