'use client'

import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RetroAchievement } from '@/types/types'
import { groupGameAchievementsByPeriod } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'

type Period = 'week' | 'month'

export function GameAchievementsProgressChart({
  achievements,
  isLoading,
}: {
  achievements: RetroAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const [period, setPeriod] = useState<Period>('week')
  const data = groupGameAchievementsByPeriod(achievements, period)
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-text-secondary text-sm">{T.gameExpanded.achievementsOverTime}</p>
        <div role="tablist" className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/5 shrink-0">
          <button
            role="tab"
            aria-selected={period === 'week'}
            onClick={() => setPeriod('week')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              period === 'week'
                ? 'bg-accent text-bg-main'
                : 'text-text-secondary hover:text-text-main hover:bg-white/8'
            }`}
          >
            {T.gameExpanded.weekly}
          </button>
          <button
            role="tab"
            aria-selected={period === 'month'}
            onClick={() => setPeriod('month')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              period === 'month'
                ? 'bg-accent text-bg-main'
                : 'text-text-secondary hover:text-text-main hover:bg-white/8'
            }`}
          >
            {T.gameExpanded.monthly}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="px-1 h-52 flex flex-col justify-end gap-1 animate-pulse">
          <div className="flex items-end gap-2 h-44">
            {[45, 70, 30, 90, 55, 20, 80, 60].map((h, i) => (
              <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center h-52 text-text-secondary text-sm text-center px-4">
          {T.gameExpanded.noActivity}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={208}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
      )}
    </div>
  )
}
