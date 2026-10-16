'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AchivementsLineChartTooltip from '../achivements-line-chart-tooltip/AchivementsLineChartTooltip'
import type { groupByDaySource } from '@/utils/utils'

/**
 * The area chart of the week's unlocks. Apart from its card so that recharts
 * (the heaviest thing on the page) is downloaded after the page is up, not
 * before it — see AchievementsLineChart.
 */
export default function AchievementsLinePlot({
  data,
  total,
  fillId,
  tick,
  animate,
  onDayClick,
}: {
  data: ReturnType<typeof groupByDaySource>
  total: number
  fillId: string
  tick: (date: string) => string
  animate: boolean
  onDayClick: (payload: { activeLabel?: string | number } | null) => void
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} onClick={onDayClick} style={{ cursor: 'pointer' }}>
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
          isAnimationActive={animate}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
