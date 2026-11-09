'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { RecentAchievement } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { calcAvgPerDay, decimal } from '@/utils/utils'
import Figure from '@/components/ui/Figure'
import { parseUnlockTime, utcDay } from '@/utils/dates'

// Downloaded the first time it opens, not with the page.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })
const PeriodAchievementsModal = dynamic(() => import('@/components/period-achievements-modal/PeriodAchievementsModal'), { loading: () => null })

const DAY_MS = 86_400_000

/**
 * Steam's stat pills. Steam has no points, so today / week / month count
 * unlocks instead; the Steam level takes RA's global rank slot, and two
 * weeks' playtime replaces nothing RA has. The streak is within the 60-day
 * activity window the unlocks come from.
 */
export default function MainPageSteamStats({
  achievements,
  streak,
  games,
  isLoading,
}: {
  achievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak: number
  games: SteamGameProgress[]
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const { profile, error } = useSteamProfile()
  // Its pill is in the row from the start: arriving late, it pushed every other one aside.
  const levelWaiting = !profile && !error
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

  const stats = useMemo(() => {
    const now = new Date()
    const todayKey = utcDay(now)
    const monthKey = now.toISOString().slice(0, 7)
    const weekAgo = now.getTime() - 7 * DAY_MS
    const minutes2w = games.reduce((sum, g) => sum + (g.playtime2Weeks ?? 0), 0)
    return {
      todayKey,
      today: achievements.filter((a) => a.Date.startsWith(todayKey)),
      week: achievements.filter((a) => parseUnlockTime(a.Date) >= weekAgo),
      month: achievements.filter((a) => a.Date.slice(0, 7) === monthKey),
      avg: calcAvgPerDay(achievements, 30),
      hours2w: Math.round(minutes2w / 60),
    }
  }, [achievements, games])

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3" aria-busy="true">
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, T.steam.level, T.streak.title, T.steam.last2Weeks].map((label) => (
          <Figure key={label} label={label} value="" loading />
        ))}
      </div>
    )
  }

  const unlocks = T.lineChart.achievements
  return (
    <div className="flex flex-wrap gap-3">
      <Figure
        label={T.pointsStats.today}
        value={stats.today.length}
        sub={stats.today.length ? unlocks : T.pointsStats.noActivity}
       
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <Figure label={T.pointsStats.thisWeek} value={stats.week.length} sub={unlocks} onClick={() => setWeekOpen(true)} />
      <Figure label={T.pointsStats.thisMonth} value={stats.month.length} sub={unlocks} onClick={() => setMonthOpen(true)} />
      <Figure label={T.pointsStats.avgPerDay} value={decimal(stats.avg, lang)} sub={T.pointsStats.perDay} />
      {(levelWaiting || profile?.level != null) && <Figure label={T.steam.level} value={profile?.level ?? ''} sub="Steam" loading={levelWaiting} />}
      <Figure
        label={T.streak.title}
        value={`${streak}d`}
        sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        tone={streak > 0 ? 'accent' : undefined}
        href="/racha"
      />
      <Figure label={T.steam.last2Weeks} value={`${stats.hours2w}${T.steam.hoursShort}`} sub={T.steam.playtime} />

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
