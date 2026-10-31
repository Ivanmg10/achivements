'use client'

import { useId, useMemo, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { RecentAchievement } from '@/types/types'
import { groupByDaySource } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import { Skeleton } from '@/components/ui/Skeleton'

// recharts is the heaviest thing on the page: it arrives after the page is up, in the room the chart keeps.
const AchievementsLinePlot = dynamic(() => import('./achievements-line-plot/AchievementsLinePlot'), {
  loading: () => <Skeleton radius="tile" className="h-full" />,
})

/**
 * The last seven days of unlocks as a line in the theme's accent, with a soft
 * fill fading down from it. A dot marks each day that had any; the tooltip
 * splits a day into RA, Steam and PSN. Above it the week's total and its best day.
 * Clicking a day opens what was unlocked on it.
 */
export default function AchievementsLineChart({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const reduce = useReducedMotion()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const data = useMemo(() => groupByDaySource(achievements, 7), [achievements])
  const total = data.reduce((sum, d) => sum + d.total, 0)
  const best = Math.max(...data.map((d) => d.total))
  const fillId = `daily-fill-${useId().replace(/:/g, '')}`
  const today = data[data.length - 1]?.date

  const tick = (date: string) =>
    date === today
      ? T.lineChart.today
      : new Date(date + 'T00:00:00').toLocaleDateString(lang, { weekday: 'short', day: 'numeric' })

  function handleChartClick(payload: { activeLabel?: string | number } | null) {
    const label = payload?.activeLabel
    if (typeof label === 'string') setSelectedDate(label)
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 flex-wrap px-1">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums leading-none text-text-main">{total}</span>
          <span className="text-xs text-text-secondary">{total === 1 ? T.lineChart.last7DaysOne : T.lineChart.last7Days}</span>
        </p>
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          {best > 0 && <span>{T.lineChart.bestDay.replace('{n}', String(best))}</span>}
        </div>
      </div>

      {isLoading ? (
        <div className="home-fit-chart h-[260px] px-1 flex flex-col justify-end gap-1">
          <div className="flex items-end gap-2 flex-1 min-h-0">
            {[45, 70, 30, 90, 55, 20, 80].map((h, i) => (
              <Skeleton key={i} radius="tag" className="flex-1" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-3" />
            ))}
          </div>
        </div>
      ) : (
        <div className="home-fit-chart h-[260px]">
        <AchievementsLinePlot data={data} total={total} fillId={fillId} tick={tick} animate={!reduce} onDayClick={handleChartClick} />
        </div>
      )}

      <AnimatePresence>
        {selectedDate && (
          <DayAchievementsModal date={selectedDate} achievements={achievements} onClose={() => setSelectedDate(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
