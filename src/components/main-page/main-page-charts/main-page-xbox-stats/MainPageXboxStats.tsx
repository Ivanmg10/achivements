'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import { calcAvgPerDay } from '@/utils/utils'
import { StatPill } from '@/components/ui/StatPill'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import PeriodAchievementsModal from '@/components/period-achievements-modal/PeriodAchievementsModal'

const DAY_MS = 86_400_000

/**
 * Xbox's stat pills, like PSN's: no points, so today / week / month count
 * achievements; the gamerscore takes RA's global rank slot. The streak is
 * within the 60-day window the achievements come from.
 */
export default function MainPageXboxStats({
  achievements,
  streak,
  isLoading,
}: {
  /** The last 60 days of achievements, in RA's shape (xboxToRecentAchievement). */
  achievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak: number
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const { summary } = useXboxSummary()
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
      avg: calcAvgPerDay(achievements, 30),
    }
  }, [achievements])

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3" aria-busy="true">
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, T.streak.title, T.xbox.gamerscore].map((label) => (
          <StatPill key={label} label={label} value="—" accent="text-text-secondary" />
        ))}
      </div>
    )
  }

  const noun = T.xbox.achievements.toLowerCase()
  return (
    <div className="flex flex-wrap gap-3">
      <StatPill
        label={T.pointsStats.today}
        value={stats.today.length}
        sub={stats.today.length ? noun : T.pointsStats.noActivity}
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <StatPill label={T.pointsStats.thisWeek} value={stats.week.length} sub={noun} onClick={() => setWeekOpen(true)} />
      <StatPill label={T.pointsStats.thisMonth} value={stats.month.length} sub={noun} onClick={() => setMonthOpen(true)} />
      <StatPill label={T.pointsStats.avgPerDay} value={stats.avg.toFixed(1)} sub={T.pointsStats.perDay} />
      {summary && <StatPill label={T.xbox.gamerscore} value={summary.gamerscore.toLocaleString(lang)} sub="Xbox" accent="text-green-500" />}
      <StatPill
        label={T.streak.title}
        value={`${streak}d`}
        sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        accent={streak > 0 ? 'text-accent' : undefined}
        href="/racha"
      />
      {summary && <StatPill label={T.xbox.achievements} value={summary.achievementsUnlocked.toLocaleString(lang)} sub={T.xbox.total} />}

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
