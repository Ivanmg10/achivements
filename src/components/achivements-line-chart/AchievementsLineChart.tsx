'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RecentAchievement } from '@/types/types'
import { groupByDaySource } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import AchivementsLineChartTooltip from './achivements-line-chart-tooltip/AchivementsLineChartTooltip'

const STEAM = '#66c0f4'

/**
 * The last seven days of unlocks, one bar per day, RA and Steam stacked in
 * their own colours (a day's count is a count, so bars, not a curve that
 * would invent values between days). Above it the week's total and its best
 * day. Clicking a day opens what was unlocked on it.
 *
 * The name is historical: it was a line chart, and three pages import it.
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
  const hasSteam = data.some((d) => d.steam > 0)
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
          {hasSteam && (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span aria-hidden="true" className="w-2 h-2 rounded-sm bg-chart-2" />RA</span>
              <span className="flex items-center gap-1"><span aria-hidden="true" className="w-2 h-2 rounded-sm bg-[#66c0f4]" />Steam</span>
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="px-1 h-64 flex flex-col justify-end gap-1 animate-pulse">
          <div className="flex items-end gap-2 h-56">
            {[45, 70, 30, 90, 55, 20, 80].map((h, i) => (
              <div key={i} className="flex-1 bg-white/10 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 h-3 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }} barCategoryGap="22%">
            <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="rgb(var(--text-secondary) / 0.15)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }}
              tickFormatter={/* istanbul ignore next */ tick}
            />
            {/* A flat 0 week still needs a real 0–1 axis, not an empty band. */}
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }}
              allowDecimals={false}
              domain={total === 0 ? [0, 1] : [0, 'auto']}
            />
            <Tooltip cursor={{ fill: 'rgb(var(--text-secondary) / 0.08)', radius: 8 }} content={<AchivementsLineChartTooltip />} />
            <Bar dataKey="ra" stackId="day" fill="rgb(var(--chart-2))" radius={hasSteam ? [0, 0, 0, 0] : [6, 6, 0, 0]} isAnimationActive={!reduce} />
            <Bar dataKey="steam" stackId="day" fill={STEAM} radius={[6, 6, 0, 0]} isAnimationActive={!reduce} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <AnimatePresence>
        {selectedDate && (
          <DayAchievementsModal date={selectedDate} achievements={achievements} onClose={() => setSelectedDate(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
