'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { streakInk, streakTier } from '@/utils/streakTier'
import { calcAvgPerDay, decimal } from '@/utils/utils'
import { parseUnlockTime, utcDay } from '@/utils/dates'
import Figure, { type FigureProps } from '@/components/ui/Figure'

// Downloaded the first time it opens, not with the page.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })
const PeriodAchievementsModal = dynamic(() => import('@/components/period-achievements-modal/PeriodAchievementsModal'), { loading: () => null })

const DAY_MS = 86_400_000

/** A pill only one platform has (Steam's level, PSN's platinum, RA's rank). `figure` null: left out once loaded, still drawn as a block while loading. */
export type ExtraFigure = { label: string; figure: FigureProps | null }

/**
 * The home's row of figures (today, this week, this month, average per day, the streak), the same for
 * every platform: RA counts points, the others count unlocks (`unit` says the word under each figure).
 * The platform's own pills go before or after the streak, and keep their room while they load.
 */
export default function MainPagePeriodStats({
  achievements,
  monthSource = achievements,
  streak,
  isLoading,
  measure = 'unlocks',
  unit,
  before = [],
  after = [],
}: {
  /** In RA's shape: today, this week and the day's window read these. */
  achievements: RecentAchievement[]
  /** This month and the average per day read these (RA's 60 days; the same list by default). */
  monthSource?: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak: number
  isLoading?: boolean
  /** `points` shows the sum of the points; `unlocks` how many. */
  measure?: 'points' | 'unlocks'
  /** The line under a figure with that many unlocks; none leaves it empty. */
  unit: (n: number) => string | undefined
  /** The platform's pills before the streak. */
  before?: ExtraFigure[]
  /** The platform's pills after the streak. */
  after?: ExtraFigure[]
}) {
  const { T, lang } = useLanguage()
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
      month: monthSource.filter((a) => a.Date.slice(0, 7) === monthKey),
      avg: calcAvgPerDay(monthSource, 30),
    }
  }, [achievements, monthSource])

  if (isLoading) {
    const labels = [T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, ...before.map((e) => e.label), T.streak.title, ...after.map((e) => e.label)]
    return (
      <div className="flex flex-wrap gap-3" aria-busy="true">
        {labels.map((label) => (
          <Figure key={label} label={label} value="" loading />
        ))}
      </div>
    )
  }

  const total = (list: RecentAchievement[]) => (measure === 'points' ? list.reduce((sum, a) => sum + a.Points, 0) : list.length)
  const extra = (e: ExtraFigure) => e.figure && <Figure key={e.label} {...e.figure} />
  return (
    <div className="flex flex-wrap gap-3">
      <Figure
        label={T.pointsStats.today}
        value={total(stats.today)}
        sub={total(stats.today) === 0 ? T.pointsStats.noActivity : unit(stats.today.length)}
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <Figure label={T.pointsStats.thisWeek} value={total(stats.week)} sub={unit(stats.week.length)} onClick={() => setWeekOpen(true)} />
      <Figure label={T.pointsStats.thisMonth} value={total(stats.month)} sub={unit(stats.month.length)} onClick={() => setMonthOpen(true)} />
      <Figure label={T.pointsStats.avgPerDay} value={decimal(stats.avg, lang)} sub={T.pointsStats.perDay} />
      {before.map(extra)}
      <Figure
        label={T.streak.title}
        value={T.rankings.daysShort.replace('{n}', streak.toLocaleString(lang))}
        sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        color={streak > 0 ? streakInk(streakTier(streak)) : undefined}
        href="/racha"
      />
      {after.map(extra)}

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
