'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { calcAvgPerDay, calcStreak } from '@/utils/utils'
import { StatPill } from '@/components/ui/StatPill'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import PeriodAchievementsModal from '@/components/period-achievements-modal/PeriodAchievementsModal'

const DAY_MS = 86_400_000

/**
 * PSN's stat pills, like Steam's: no points, so today / week / month count
 * trophies; the trophy level takes RA's global rank slot, and the platinum
 * total stands where Steam shows playtime (Sony reports none).
 * The streak is within the 60-day window the trophies come from.
 */
export default function MainPagePsnStats({
  achievements,
  isLoading,
}: {
  /** The last 60 days of trophies, in RA's shape (psnToRecentAchievement). */
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const { summary } = usePsnSummary()
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

  const stats = useMemo(() => {
    const now = new Date()
    const todayKey = now.toISOString().split('T')[0]
    const monthKey = now.toISOString().slice(0, 7)
    const weekAgo = now.getTime() - 7 * DAY_MS
    return {
      todayKey,
      today: achievements.filter((a) => a.Date.startsWith(todayKey)),
      week: achievements.filter((a) => new Date(a.Date.replace(' ', 'T')).getTime() >= weekAgo),
      month: achievements.filter((a) => a.Date.slice(0, 7) === monthKey),
      streak: calcStreak(achievements),
      avg: calcAvgPerDay(achievements, 30),
    }
  }, [achievements])

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3" aria-busy="true">
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, T.streak.title, T.psn.level].map((label) => (
          <StatPill key={label} label={label} value="—" accent="text-text-secondary" />
        ))}
      </div>
    )
  }

  const trophies = T.psn.trophies.toLowerCase()
  return (
    <div className="flex flex-wrap gap-3">
      <StatPill
        label={T.pointsStats.today}
        value={stats.today.length}
        sub={stats.today.length ? trophies : T.pointsStats.noActivity}
        accent="text-purple-400"
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <StatPill label={T.pointsStats.thisWeek} value={stats.week.length} sub={trophies} accent="text-yellow-400" onClick={() => setWeekOpen(true)} />
      <StatPill label={T.pointsStats.thisMonth} value={stats.month.length} sub={trophies} accent="text-red-400" onClick={() => setMonthOpen(true)} />
      <StatPill label={T.pointsStats.avgPerDay} value={stats.avg.toFixed(1)} sub={T.pointsStats.perDay} accent="text-info" />
      {summary && <StatPill label={T.psn.level} value={summary.trophyLevel} sub="PlayStation" accent="text-[#0070d1]" />}
      <StatPill
        label={T.streak.title}
        value={`${stats.streak}d`}
        sub={stats.streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        accent={stats.streak >= 7 ? 'text-warning' : stats.streak > 0 ? 'text-success' : undefined}
        href="/racha"
      />
      {summary && <StatPill label={T.psn.platinum} value={summary.earned.platinum} sub={T.psn.total} accent="text-sky-300" />}

      <AnimatePresence>
        {selectedDay && (
          <DayAchievementsModal date={selectedDay} achievements={achievements} onClose={() => setSelectedDay(null)} />
        )}
        {weekOpen && (
          <PeriodAchievementsModal title={T.pointsStats.thisWeek} achievements={stats.week} onClose={() => setWeekOpen(false)} />
        )}
        {monthOpen && (
          <PeriodAchievementsModal title={T.pointsStats.thisMonth} achievements={stats.month} onClose={() => setMonthOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
