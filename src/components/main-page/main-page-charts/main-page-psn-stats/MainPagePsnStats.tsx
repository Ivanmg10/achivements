'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { calcAvgPerDay, decimal } from '@/utils/utils'
import Figure from '@/components/ui/Figure'
import { parseUnlockTime, utcDay } from '@/utils/dates'

// Downloaded the first time it opens, not with the page.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })
const PeriodAchievementsModal = dynamic(() => import('@/components/period-achievements-modal/PeriodAchievementsModal'), { loading: () => null })

const DAY_MS = 86_400_000

/**
 * PSN's stat pills, like Steam's: no points, so today / week / month count
 * trophies; the trophy level takes RA's global rank slot, and the platinum
 * total stands where Steam shows playtime (Sony reports none).
 * The streak is within the 60-day window the trophies come from.
 */
export default function MainPagePsnStats({
  achievements,
  streak,
  isLoading,
}: {
  /** The last 60 days of trophies, in RA's shape (psnToRecentAchievement). */
  achievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak: number
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const { summary, error } = usePsnSummary()
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
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, T.psn.level, T.streak.title, T.psn.platinum].map((label) => (
          <Figure key={label} label={label} value="" loading />
        ))}
      </div>
    )
  }

  const trophies = T.psn.trophies.toLowerCase()
  return (
    <div className="flex flex-wrap gap-3">
      <Figure
        label={T.pointsStats.today}
        value={stats.today.length}
        sub={stats.today.length ? trophies : T.pointsStats.noActivity}
       
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <Figure label={T.pointsStats.thisWeek} value={stats.week.length} sub={trophies} onClick={() => setWeekOpen(true)} />
      <Figure label={T.pointsStats.thisMonth} value={stats.month.length} sub={trophies} onClick={() => setMonthOpen(true)} />
      <Figure label={T.pointsStats.avgPerDay} value={decimal(stats.avg, lang)} sub={T.pointsStats.perDay} />
      {(summary || summaryWaiting) && <Figure label={T.psn.level} value={summary?.trophyLevel ?? ''} sub="PlayStation" loading={summaryWaiting} />}
      <Figure
        label={T.streak.title}
        value={T.rankings.daysShort.replace('{n}', streak.toLocaleString(lang))}
        sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        tone={streak > 0 ? 'accent' : undefined}
        href="/racha"
      />
      {(summary || summaryWaiting) && <Figure label={T.psn.platinum} value={summary?.earned.platinum ?? ''} sub={T.psn.total} tone="platinum" loading={summaryWaiting} />}

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
