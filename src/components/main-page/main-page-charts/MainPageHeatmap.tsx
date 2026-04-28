'use client'

import { useMemo, useEffect, useState } from 'react'
import { RecentAchievement } from '@/types/types'
import { groupByDays } from '@/utils/utils'

function cellBg(count: number): string {
  if (count === 0) return '#1a1a2e'
  if (count <= 2) return '#3730a3'
  if (count <= 5) return '#4f46e5'
  if (count <= 9) return '#6366f1'
  return '#818cf8'
}

function useTotalDays() {
  const [days, setDays] = useState(182)
  useEffect(() => {
    function calc() {
      const w = window.innerWidth
      setDays(w < 640 ? 91 : w < 1024 ? 120 : 182)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return days
}

const GAP = 3  // px

export default function MainPageHeatmap({ achievements }: { achievements: RecentAchievement[] }) {
  const totalDays = useTotalDays()
  const label = totalDays <= 91 ? 'last 3 months' : totalDays <= 120 ? 'last 4 months' : 'last 6 months'

  const { totalAch, truncated, weeks, monthLabels } = useMemo(() => {
    const data = groupByDays(achievements, totalDays)
    const totalAch = data.reduce((s, d) => s + d.count, 0)
    const truncated = achievements.length >= 500

    const firstDow = new Date(data[0].date).getDay()
    const padded = [...Array(firstDow).fill(null), ...data]

    const weeks: (typeof data[0] | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = ''
    weeks.forEach((week, wi) => {
      const firstReal = week.find((d) => d !== null)
      if (!firstReal) return
      const m = new Date(firstReal.date).toLocaleString('default', { month: 'short' })
      if (m !== lastMonth) { monthLabels.push({ label: m, col: wi }); lastMonth = m }
    })

    return { totalAch, truncated, weeks, monthLabels }
  }, [achievements, totalDays])

  // max cell size per breakpoint prevents cells bloating on wide/sparse cards
  const cellMax = totalDays <= 91 ? 20 : totalDays <= 120 ? 17 : 14
  const maxWidth = weeks.length * cellMax + (weeks.length - 1) * GAP
  const gridCols = `repeat(${weeks.length}, 1fr)`

  return (
    <div
      className="flex flex-col w-full flex-1"
      role="img"
      aria-label={`Achievement activity heatmap — ${totalAch} achievements in the ${label}`}
    >
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-1 shrink-0 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Activity — {label}</p>
        <div className="flex items-center gap-2">
          {truncated && (
            <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
              500 max — older activity may be missing
            </span>
          )}
          <p className="text-xs font-semibold text-text-main">{totalAch}</p>
        </div>
      </div>

      {/* grid — fills width, capped at CELL_MAX per column */}
      <div
        className="flex-1 flex flex-col justify-center gap-1"
        aria-hidden="true"
      >
        <div className="w-full mx-auto flex flex-col gap-1" style={{ maxWidth }}>
          {/* month labels */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: `${GAP}px` }}>
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find((m) => m.col === wi)
              return (
                <div key={wi} style={{ height: 12, overflow: 'hidden' }}>
                  {lbl && (
                    <span className="text-[7px] text-text-secondary whitespace-nowrap leading-none">
                      {lbl.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* cells — column-by-column via grid-auto-flow */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              gridTemplateRows: 'repeat(7, auto)',
              gridAutoFlow: 'column',
              gap: `${GAP}px`,
            }}
          >
            {weeks.flatMap((week, wi) =>
              Array.from({ length: 7 }).map((_, di) => {
                const cell = week[di] ?? null
                return (
                  <div
                    key={`${wi}-${di}`}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: cell ? cellBg(cell.count) : '#0f0f1a' }}
                  />
                )
              })
            )}
          </div>

          {/* legend */}
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[8px] text-text-secondary">Less</span>
            {[0, 1, 3, 6, 10].map((v) => (
              <div
                key={v}
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: cellBg(v) }}
              />
            ))}
            <span className="text-[8px] text-text-secondary">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
