'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import { calcAvgPerDay, decimal } from '@/utils/utils'
import Figure from '@/components/ui/Figure'
import { parseUnlockTime, utcDay } from '@/utils/dates'

// Downloaded the first time it opens, not with the page.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })
const PeriodAchievementsModal = dynamic(() => import('@/components/period-achievements-modal/PeriodAchievementsModal'), { loading: () => null })

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
  const { summary, error } = useXboxSummary()
  // Its pills are in the row from the start: arriving late, they pushed every other one aside.
  const summaryWaiting = !summary && !error
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

  const stats = useMemo(() => {
    const now = new Date()
    const todayKey = utcDay(now)
    const monthKey = now.toISOString().slice(0, 7)
    const weekAgo = now.getTime() - 7 * DAY_MS
    return {
      todayKey,
      today: achievements.filter((a) => a.Date.startsWith(todayKey)),
      week: achievements.filter((a) => parseUnlockTime(a.Date) >= weekAgo),
      month: achievements.filter((a) => a.Date.slice(0, 7) === monthKey),
      avg: calcAvgPerDay(achievements, 30),
    }
  }, [achievements])

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3" aria-busy="true">
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, T.xbox.gamerscore, T.streak.title, T.xbox.achievements].map((label) => (
          <Figure key={label} label={label} value="" loading />
        ))}
      </div>
    )
  }

  const noun = T.xbox.achievements.toLowerCase()
  return (
    <div className="flex flex-wrap gap-3">
      <Figure
        label={T.pointsStats.today}
        value={stats.today.length}
        sub={stats.today.length ? noun : T.pointsStats.noActivity}
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <Figure label={T.pointsStats.thisWeek} value={stats.week.length} sub={noun} onClick={() => setWeekOpen(true)} />
      <Figure label={T.pointsStats.thisMonth} value={stats.month.length} sub={noun} onClick={() => setMonthOpen(true)} />
      <Figure label={T.pointsStats.avgPerDay} value={decimal(stats.avg, lang)} sub={T.pointsStats.perDay} />
      {(summary || summaryWaiting) && <Figure label={T.xbox.gamerscore} value={summary?.gamerscore.toLocaleString(lang) ?? ''} sub="Xbox" tone="success" loading={summaryWaiting} />}
      <Figure
        label={T.streak.title}
        value={`${streak}d`}
        sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        tone={streak > 0 ? 'accent' : undefined}
        href="/racha"
      />
      {(summary || summaryWaiting) && <Figure label={T.xbox.achievements} value={summary?.achievementsUnlocked.toLocaleString(lang) ?? ''} sub={T.xbox.total} loading={summaryWaiting} />}

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
