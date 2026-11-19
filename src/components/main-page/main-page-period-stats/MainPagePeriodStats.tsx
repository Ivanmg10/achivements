'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { streakInk, streakTier } from '@/utils/streakTier'
import { calcAvgPerDay, decimal, plural } from '@/utils/utils'
import { addDays, localDay } from '@/utils/dates'
import { dayOf } from '@/utils/periodDays'
import Figure, { FIGURES_BY_THREE } from '@/components/ui/Figure'

// Downloaded the first time it opens, not with the page.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })
const PeriodAchievementsModal = dynamic(() => import('@/components/period-achievements-modal/PeriodAchievementsModal'), { loading: () => null })

/**
 * The home's summary of activity: today, the last 7 calendar days (today and the 6 before), the last 30 (today and the 29 before), the average per day and the
 * streak, counting unlocks of every platform together whichever tab is open (#128). The account's
 * totals (level, platinum, gamerscore, rank) are on each platform's profile card, not here.
 * `streak` null leaves the streak out (the cover has its own card for it).
 */
export default function MainPagePeriodStats({
  achievements,
  monthSource = achievements,
  streak,
  isLoading,
}: {
  /** Every platform's unlocks, in RA's shape: today and the week read these. */
  achievements: RecentAchievement[]
  /** The last 30 days and the average per day read these (the year; the same list by default). */
  monthSource?: RecentAchievement[]
  /** Current streak in days, the top bar's; null leaves it out. */
  streak: number | null
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

  const stats = useMemo(() => {
    const todayKey = localDay(new Date())
    // Days of the reader's calendar, as the rest of the home: today and the 6 before, today and the 29 before.
    const inLast = (days: number) => {
      const since = addDays(todayKey, 1 - days)
      return (a: RecentAchievement) => dayOf(a) >= since
    }
    return {
      todayKey,
      today: achievements.filter((a) => dayOf(a) === todayKey),
      week: achievements.filter(inLast(7)),
      month: monthSource.filter(inLast(30)),
      avg: calcAvgPerDay(monthSource, 30),
    }
  }, [achievements, monthSource])

  const labels = [T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.last30Days, T.pointsStats.avgPerDay, ...(streak === null ? [] : [T.streak.title])]
  if (isLoading) {
    return (
      <div className={FIGURES_BY_THREE} aria-busy="true">
        {labels.map((label) => (
          <Figure key={label} label={label} value="" loading />
        ))}
      </div>
    )
  }

  const unit = (n: number) => plural(n, T.plurals.achievementsWord, lang)
  return (
    <div className={FIGURES_BY_THREE}>
      <Figure
        label={T.pointsStats.today}
        value={stats.today.length}
        sub={stats.today.length === 0 ? T.pointsStats.noActivity : unit(stats.today.length)}
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <Figure label={T.pointsStats.thisWeek} value={stats.week.length} sub={unit(stats.week.length)} onClick={() => setWeekOpen(true)} />
      <Figure label={T.pointsStats.last30Days} value={stats.month.length} sub={unit(stats.month.length)} onClick={() => setMonthOpen(true)} />
      <Figure label={T.pointsStats.avgPerDay} value={decimal(stats.avg, lang)} sub={T.pointsStats.perDay} />
      {streak !== null && (
        <Figure
          label={T.streak.title}
          value={T.rankings.daysShort.replace('{n}', streak.toLocaleString(lang))}
          sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
          color={streak > 0 ? streakInk(streakTier(streak)) : undefined}
          href="/racha"
        />
      )}

      <AnimatePresence>
        {selectedDay && (
          <DayAchievementsModal date={selectedDay} achievements={achievements} onClose={() => setSelectedDay(null)} />
        )}
        {weekOpen && (
          <PeriodAchievementsModal title={T.pointsStats.thisWeek} achievements={stats.week} onClose={() => setWeekOpen(false)} />
        )}
        {monthOpen && (
          <PeriodAchievementsModal title={T.pointsStats.last30Days} achievements={stats.month} onClose={() => setMonthOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
