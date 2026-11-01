'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { RecentAchievement } from '@/types/types'
import { groupByDaySource } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import { LineChartSkeleton } from '@/components/ui/ChartSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'
import AchivementsLineChartTooltip from './achivements-line-chart-tooltip/AchivementsLineChartTooltip'

// recharts is the heaviest thing on the page: it arrives after the page is up, in the room the chart keeps.
const AchievementsLinePlot = dynamic(() => import('./achievements-line-plot/AchievementsLinePlot'), {
  loading: () => <LineChartSkeleton />,
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const data = useMemo(() => groupByDaySource(achievements, 7), [achievements])
  const total = data.reduce((sum, d) => sum + d.total, 0)
  const best = Math.max(...data.map((d) => d.total))
  const today = data[data.length - 1]?.date

  const tick = (date: string) =>
    date === today
      ? T.lineChart.today
      : new Date(date + 'T00:00:00').toLocaleDateString(lang, { weekday: 'short', day: 'numeric' })

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 flex-wrap px-1">
        <p className={`flex gap-2 ${isLoading ? 'items-end' : 'items-baseline'}`}>
          <span className="text-3xl font-bold tabular-nums leading-none text-text-main">{isLoading ? <Skeleton className="h-[1lh] w-10" /> : total}</span>
          <span className="text-xs text-text-secondary">{total === 1 ? T.lineChart.last7DaysOne : T.lineChart.last7Days}</span>
        </p>
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          {best > 0 && <span>{T.lineChart.bestDay.replace('{n}', String(best))}</span>}
        </div>
      </div>

      <div className="home-fit-chart h-[260px]">
      {isLoading ? (
        <LineChartSkeleton />
      ) : (
        <AchievementsLinePlot data={data} x="date" y="total" tick={tick} tooltip={<AchivementsLineChartTooltip />} onPick={setSelectedDate} />
      )}
      </div>

      <AnimatePresence>
        {selectedDate && (
          <DayAchievementsModal date={selectedDate} achievements={achievements} onClose={() => setSelectedDate(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
