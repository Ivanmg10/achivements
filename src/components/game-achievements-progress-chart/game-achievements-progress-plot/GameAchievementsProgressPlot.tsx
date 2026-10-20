'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLanguage } from '@/context/LanguageContext'
import type { groupGameAchievementsByPeriod } from '@/utils/utils'

/**
 * The line of a game's unlocks over time. Apart from its card so that recharts
 * (the heaviest thing on the page) is only downloaded when a card with unlocks
 * to draw is opened — see GameAchievementsProgressChart.
 */
export default function GameAchievementsProgressPlot({
  data,
  onSelect,
}: {
  data: ReturnType<typeof groupGameAchievementsByPeriod>
  /** A point was clicked: the label of its week or month. */
  onSelect: (label: string) => void
}) {
  const { T } = useLanguage()
  return (
    <ResponsiveContainer width="100%" height={208}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        onClick={/* istanbul ignore next */ (p: { activeLabel?: string | number } | null) => {
          if (typeof p?.activeLabel === 'string') onSelect(p.activeLabel)
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--bg-header))" />
        <XAxis dataKey="label" tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} />
        <YAxis tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }} allowDecimals={false} width={28} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--bg-card))',
            border: '1px solid rgb(var(--bg-header))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'rgb(var(--text-main))' }}
          formatter={/* istanbul ignore next */ (value) => [`${value} ${T.lineChart.achievements}`, '']}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="rgb(var(--accent))"
          strokeWidth={2}
          dot={{ fill: 'rgb(var(--accent))', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
