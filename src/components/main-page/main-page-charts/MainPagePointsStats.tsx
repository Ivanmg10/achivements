'use client'

import dynamic from 'next/dynamic'
import { streakInk, streakTier } from '@/utils/streakTier'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement, UserRankAndScore } from '@/types/types'
import { calcAvgPerDay, calcThisMonth, plural, decimal } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import Figure from '@/components/ui/Figure'
import { parseUnlockTime, utcDay } from '@/utils/dates'

// Downloaded the first time it opens, not with the page.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })
const PeriodAchievementsModal = dynamic(() => import('@/components/period-achievements-modal/PeriodAchievementsModal'), { loading: () => null })

export default function MainPagePointsStats({
  achievements,
  heatmapAchievements,
  streak = 0,
  rank,
  showRank = true,
  valueMode = 'points',
  isLoading,
}: {
  achievements: RecentAchievement[]
  heatmapAchievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak?: number
  rank: UserRankAndScore | null
  /** Portada keeps only the five activity figures; Classic also shows global rank. */
  showRank?: boolean
  /** Global cover stats count unlocks; Classic's platform-specific stats count RA points. */
  valueMode?: 'points' | 'achievements'
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, ...(showRank ? [T.userStats.globalRank] : []), T.streak.title].map((label) => (
          <Figure key={label} label={label} value="" loading />
        ))}
      </div>
    )
  }

  const safeList = Array.isArray(achievements) ? achievements : []
  const safeHeatmap = Array.isArray(heatmapAchievements) ? heatmapAchievements : []
  const now = new Date()
  const todayKey = utcDay(now)
  const monthKey = now.toISOString().slice(0, 7)
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)

  let ptsToday = 0, achToday = 0
  const weekAchievements: RecentAchievement[] = []

  for (const a of safeList) {
    const d = new Date(parseUnlockTime(a.Date))
    if (a.Date.startsWith(todayKey)) { ptsToday += a.Points; achToday++ }
    if (d >= weekAgo) weekAchievements.push(a)
  }

  const pts7d = weekAchievements.reduce((s, a) => s + a.Points, 0)
  const monthAchievements = safeHeatmap.filter((a) => a.Date.slice(0, 7) === monthKey)
  const thisMonth = calcThisMonth(safeHeatmap)
  const avgPerDay = calcAvgPerDay(safeHeatmap, 30)
  const todaySub = ptsToday === 0 ? T.pointsStats.noActivity : plural(achToday, T.plurals.achievements, lang)

  return (
    <div className="flex flex-wrap gap-3">
      <Figure label={T.pointsStats.today} value={valueMode === 'points' ? ptsToday : achToday} sub={valueMode === 'points' ? todaySub : achToday === 0 ? T.pointsStats.noActivity : undefined} onClick={() => setSelectedDay(todayKey)} />
      <Figure label={T.pointsStats.thisWeek} value={valueMode === 'points' ? pts7d : weekAchievements.length} sub={valueMode === 'points' ? plural(weekAchievements.length, T.plurals.achievements, lang) : undefined} onClick={() => setWeekOpen(true)} />
      <Figure label={T.pointsStats.thisMonth} value={valueMode === 'points' ? thisMonth.pts : thisMonth.ach} sub={valueMode === 'points' ? plural(thisMonth.ach, T.plurals.achievements, lang) : undefined} onClick={() => setMonthOpen(true)} />
      <Figure label={T.pointsStats.avgPerDay} value={decimal(avgPerDay, lang)} sub={T.pointsStats.perDay} />
      {showRank && rank?.Rank != null && <Figure label={T.userStats.globalRank} value={`#${rank.Rank.toLocaleString(lang)}`} sub={`${(rank.Score ?? 0).toLocaleString(lang)} ${T.libraryDetail.pointsShort}`} />}
      <Figure label={T.streak.title} value={T.rankings.daysShort.replace('{n}', streak.toLocaleString(lang))} sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak} color={streak > 0 ? streakInk(streakTier(streak)) : undefined} href="/racha" />

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
