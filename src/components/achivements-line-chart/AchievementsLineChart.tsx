'use client'

import { useId, useMemo, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RecentAchievement } from '@/types/types'
import { groupByDaySource } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import AchivementsLineChartTooltip from './achivements-line-chart-tooltip/AchivementsLineChartTooltip'

/**
 * The last seven days of unlocks as a line in the theme's accent, with a soft
 * fill fading down from it. A dot marks each day that had any; the tooltip
 * splits a day into RA and Steam. Above it the week's total and its best day.
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
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip
              cursor={{ stroke: 'rgb(var(--text-secondary) / 0.35)', strokeDasharray: '3 3' }}
              content={<AchivementsLineChartTooltip />}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="rgb(var(--accent))"
              strokeWidth={2.5}
              fill={`url(#${fillId})`}
              dot={/* istanbul ignore next */ (p: { cx?: number; cy?: number; payload?: { total: number }; index?: number }) =>
                p.payload && p.payload.total > 0 ? (
                  <circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill="rgb(var(--accent))" stroke="rgb(var(--bg-card))" strokeWidth={2} />
                ) : (
                  <g key={p.index} />
                )
              }
              activeDot={{ r: 6, fill: 'rgb(var(--accent))', stroke: 'rgb(var(--bg-card))', strokeWidth: 2 }}
              isAnimationActive={!reduce}
            />
          </AreaChart>
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
