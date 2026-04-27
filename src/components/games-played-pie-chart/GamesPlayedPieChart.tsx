'use client'

import { RetroAchievementsGameCompleted } from '@/types/types'
import { groupByConsole } from '@/utils/utils'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useLanguage } from '@/context/LanguageContext'

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
]

export default function ConsolesPieChart({ games }: { games: RetroAchievementsGameCompleted[] }) {
  const data = groupByConsole(games)
  const { T } = useLanguage()

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 w-full text-text-secondary text-sm">
        {T.pieChart.noData}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="90%" height={420}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={85}
          outerRadius={145}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e1e2e',
            border: 'none',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={
            /* istanbul ignore next */ (value, entry: any) => `${value} (${entry.payload?.value})`
          }
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
