'use client'

import { RetroAchievementsGameCompleted } from '@/types/types'
import { groupByConsole } from '@/utils/utils'
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
  const data = groupByConsole(games).sort((a, b) => b.value - a.value).slice(0, 6)
  const { T } = useLanguage()
  const max = data[0]?.value ?? 1

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full text-text-secondary text-sm">
        {T.pieChart.noData}
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full gap-2">
      {/* bars */}
      <div className="flex items-end justify-around gap-2 w-full flex-1 min-h-0">
        {data.map(({ name, value }, i) => {
          const color = COLORS[i % COLORS.length]
          const shortName = name
            .replace('PlayStation', 'PS')
            .replace('Nintendo', 'N')
            .replace('Game Boy', 'GB')
            .replace(' Advance', 'A')
            .replace(' Portable', 'P')
          return (
            <div key={name} className="flex flex-col items-center gap-1.5 flex-1 min-w-0 h-full">
              <span className="text-[10px] font-bold shrink-0" style={{ color }}>{value}</span>

              {/* column track */}
              <div
                className="flex-1 w-full rounded-md flex flex-col justify-end min-h-0 overflow-hidden"
                style={{ backgroundColor: `${color}18` }}
              >
                {/* spacer */}
                <div style={{ flexGrow: max - value }} />
                {/* bar */}
                <div
                  className="w-full rounded-md"
                  style={{
                    flexGrow: value,
                    minHeight: '6px',
                    background: `linear-gradient(to top, ${color}99, ${color})`,
                    boxShadow: `0 0 10px ${color}66, inset 0 1px 0 ${color}cc`,
                  }}
                />
              </div>

              <span className="text-[9px] text-text-secondary text-center leading-tight truncate w-full shrink-0">
                {shortName}
              </span>
            </div>
          )
        })}
      </div>

      {/* baseline */}
      <div className="h-px w-full bg-white/10 shrink-0" />
    </div>
  )
}
