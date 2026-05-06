'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import { groupByDay } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function AchievementsLineChart({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const data = groupByDay(achievements)
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const { T } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  function handleChartClick(payload: { activeLabel?: string | number } | null) {
    const label = payload?.activeLabel
    if (typeof label === 'string') setSelectedDate(label)
  }

  return (
    <div className="w-full">
      <p className="text-text-secondary text-sm px-4 pb-3">
        {T.lineChart.achievementsLast7Days.replace('{total}', String(total))}
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center h-85 text-text-secondary text-sm">
          Loading...
        </div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center h-85 text-text-secondary text-sm">
          {T.lineChart.noActivity}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e3e" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={/* istanbul ignore next */ (val: string) => val.slice(5)}
            />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e2e',
                border: 'none',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              formatter={/* istanbul ignore next */ (value) => [`${value} ${T.lineChart.achievements}`, '']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <AnimatePresence>
        {selectedDate && (
          <DayAchievementsModal
            date={selectedDate}
            achievements={achievements}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
