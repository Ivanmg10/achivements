'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { RecentAchievement } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { calcAvgPerDay, calcStreak } from '@/utils/utils'
import { StatPill } from '@/components/ui/StatPill'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import PeriodAchievementsModal from '@/components/period-achievements-modal/PeriodAchievementsModal'

const DAY_MS = 86_400_000

/**
 * Steam's stat pills. Steam has no points, so today / week / month count
 * unlocks instead; the Steam level takes RA's global rank slot, and two
 * weeks' playtime replaces nothing RA has. The streak is within the 60-day
 * activity window the unlocks come from.
 */
export default function MainPageSteamStats({
  achievements,
  games,
  isLoading,
}: {
  achievements: RecentAchievement[]
  games: SteamGameProgress[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const { profile } = useSteamProfile()
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

  const stats = useMemo(() => {
    const now = new Date()
    const todayKey = now.toISOString().split('T')[0]
    const monthKey = now.toISOString().slice(0, 7)
    const weekAgo = now.getTime() - 7 * DAY_MS
    const minutes2w = games.reduce((sum, g) => sum + (g.playtime2Weeks ?? 0), 0)
    return {
      todayKey,
      today: achievements.filter((a) => a.Date.startsWith(todayKey)),
      week: achievements.filter((a) => new Date(a.Date.replace(' ', 'T')).getTime() >= weekAgo),
      month: achievements.filter((a) => a.Date.slice(0, 7) === monthKey),
      streak: calcStreak(achievements),
      avg: calcAvgPerDay(achievements, 30),
      hours2w: Math.round(minutes2w / 60),
    }
  }, [achievements, games])

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3" aria-busy="true">
        {[T.pointsStats.today, T.pointsStats.thisWeek, T.pointsStats.thisMonth, T.pointsStats.avgPerDay, T.streak.title, T.steam.last2Weeks].map((label) => (
          <StatPill key={label} label={label} value="—" accent="text-text-secondary" />
        ))}
      </div>
    )
  }

  const unlocks = T.lineChart.achievements
  return (
    <div className="flex flex-wrap gap-3">
      <StatPill
        label={T.pointsStats.today}
        value={stats.today.length}
        sub={stats.today.length ? unlocks : T.pointsStats.noActivity}
        accent="text-purple-400"
        onClick={() => setSelectedDay(stats.todayKey)}
      />
      <StatPill label={T.pointsStats.thisWeek} value={stats.week.length} sub={unlocks} accent="text-yellow-400" onClick={() => setWeekOpen(true)} />
      <StatPill label={T.pointsStats.thisMonth} value={stats.month.length} sub={unlocks} accent="text-red-400" onClick={() => setMonthOpen(true)} />
      <StatPill label={T.pointsStats.avgPerDay} value={stats.avg.toFixed(1)} sub={T.pointsStats.perDay} accent="text-info" />
      {profile?.level != null && <StatPill label={T.steam.level} value={profile.level} sub="Steam" accent="text-[#66c0f4]" />}
      <StatPill
        label={T.streak.title}
        value={`${stats.streak}d`}
        sub={stats.streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        accent={stats.streak >= 7 ? 'text-warning' : stats.streak > 0 ? 'text-success' : undefined}
      />
      <StatPill label={T.steam.last2Weeks} value={`${stats.hours2w}${T.steam.hoursShort}`} sub={T.steam.playtime} accent="text-accent" />

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
