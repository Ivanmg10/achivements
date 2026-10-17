'use client'

import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconCalendarEvent, IconCalendarMonth, IconCalendarWeek } from '@tabler/icons-react'
import { RecentAchievement } from '@/types/types'
import MainPageBestPeriodRow from './main-page-best-period-row/MainPageBestPeriodRow'
import { getBestMonth } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import WeekAchievementsModal from '@/components/week-achievements-modal/WeekAchievementsModal'
import PeriodAchievementsModal from '@/components/period-achievements-modal/PeriodAchievementsModal'

type Metric = 'pts' | 'ach'

function getBestDay(achievements: RecentAchievement[], by: Metric) {
  const byDay: Record<string, { pts: number; ach: number }> = {}
  for (const a of achievements) {
    const key = a.Date.split(' ')[0]
    if (!byDay[key]) byDay[key] = { pts: 0, ach: 0 }
    byDay[key].pts += a.Points
    byDay[key].ach++
  }
  return Object.entries(byDay).sort((a, b) => b[1][by] - a[1][by])[0] ?? null
}

function getBestWeek(achievements: RecentAchievement[], by: Metric) {
  const byWeek: Record<string, { pts: number; ach: number }> = {}
  for (const a of achievements) {
    const d = new Date(a.Date.replace(' ', 'T'))
    const day = d.getDay() || 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - day + 1)
    const key = monday.toISOString().split('T')[0]
    if (!byWeek[key]) byWeek[key] = { pts: 0, ach: 0 }
    byWeek[key].pts += a.Points
    byWeek[key].ach++
  }
  return Object.entries(byWeek).sort((a, b) => b[1][by] - a[1][by])[0] ?? null
}

export default function MainPageBestPeriod({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  // Steam, PSN and Xbox have no points: their best periods are the ones with the most unlocks.
  const isSteam = achievements.some((a) => a.Source === 'steam' || a.Source === 'psn' || a.Source === 'xbox')
  const metric: Metric = isSteam ? 'ach' : 'pts'

  const { bestDay, bestWeek, bestMonth } = useMemo(() => ({
    bestDay: getBestDay(achievements, metric),
    bestWeek: getBestWeek(achievements, metric),
    bestMonth: getBestMonth(achievements, metric),
  }), [achievements, metric])

  /** The period's total: RA counts points, Steam counts unlocks. */
  const amount = (p: { pts: number; ach: number }) =>
    isSteam
      ? { value: p.ach.toLocaleString(), unit: T.lineChart.achievements }
      : { value: p.pts.toLocaleString(), unit: 'pts' }
  /** The line under the period: when it was, with RA's unlock count alongside. */
  const when = (p: { pts: number; ach: number }, date: string) =>
    isSteam ? date : `${p.ach} ${T.lineChart.achievements} · ${date}`

  const closeDayModal = useCallback(() => setSelectedDay(null), [])
  const closeWeekModal = useCallback(() => setSelectedWeek(null), [])

  const closeMonthModal = useCallback(() => setSelectedMonth(null), [])

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.bestPerformance}</p>

      {isLoading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-main rounded-lg px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ink/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-2 w-16 bg-ink/10 rounded" />
                <div className="h-2 w-28 bg-ink/10 rounded" />
              </div>
              <div className="h-5 w-10 bg-ink/10 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Best Day — purple */}
          {bestDay ? (
            <MainPageBestPeriodRow
              label={T.cards.bestDay}
              tone="purple"
              icon={<IconCalendarEvent className="w-4 h-4" />}
              {...amount(bestDay[1])}
              when={when(bestDay[1], T.cards.dayOf.replace('{date}', bestDay[0]))}
              onClick={() => setSelectedDay(bestDay[0])}
            />
          ) : (
            <div className="bg-bg-main rounded-lg px-3 py-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}

          {/* Best Week — yellow */}
          {bestWeek ? (
            <MainPageBestPeriodRow
              label={T.cards.bestWeek}
              tone="yellow"
              icon={<IconCalendarWeek className="w-4 h-4" />}
              {...amount(bestWeek[1])}
              when={when(bestWeek[1], T.cards.weekOf.replace('{date}', bestWeek[0]))}
              onClick={() => setSelectedWeek(bestWeek[0])}
            />
          ) : (
            <div className="bg-bg-main rounded-lg px-3 py-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}

          {/* Best Month — red */}
          {/* Its days open in a modal, like the day and the week: unfolded in place, the list pushed the card's row down. */}
          {bestMonth ? (
            <MainPageBestPeriodRow
              label={T.cards.bestMonth}
              tone="red"
              icon={<IconCalendarMonth className="w-4 h-4" />}
              {...amount(bestMonth[1])}
              when={when(bestMonth[1], bestMonth[0])}
              onClick={() => setSelectedMonth(bestMonth[0])}
            />
          ) : (
            <div className="bg-bg-main rounded-lg p-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedDay && (
          <DayAchievementsModal
            date={selectedDay}
            achievements={achievements}
            onClose={closeDayModal}
          />
        )}
        {selectedWeek && (
          <WeekAchievementsModal
            startDate={selectedWeek}
            achievements={achievements}
            onClose={closeWeekModal}
          />
        )}
        {selectedMonth && (
          <PeriodAchievementsModal
            title={`${T.cards.bestMonth} · ${selectedMonth}`}
            achievements={achievements.filter((a) => a.Date.startsWith(selectedMonth))}
            onClose={closeMonthModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
