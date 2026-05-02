'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { RecentAchievement } from '@/types/types'
import { groupByDays } from '@/utils/utils'

function cellBg(count: number): string {
  if (count === 0) return '#1a1a2e'
  if (count <= 2) return '#3730a3'
  if (count <= 5) return '#4f46e5'
  if (count <= 9) return '#6366f1'
  return '#818cf8'
}

// mobile → 30d, tablet → 45d, desktop → 60d
function useTotalDays() {
  const [days, setDays] = useState(60)
  useEffect(() => {
    function calc() {
      const w = window.innerWidth
      setDays(w < 640 ? 30 : w < 1024 ? 45 : 60)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return days
}

const GAP = 3

export default function MainPageHeatmap({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const totalDays = useTotalDays()
  const label = totalDays <= 30 ? 'last 30 days' : totalDays <= 45 ? 'last 45 days' : 'last 60 days'
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { totalAch, weeks, monthLabels } = useMemo(() => {
    const data = groupByDays(achievements, totalDays)
    const totalAch = data.reduce((s, d) => s + d.count, 0)

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

    return { totalAch, weeks, monthLabels }
  }, [achievements, totalDays])

  // larger cellMax = bigger cells since we have fewer weeks now
  const cellMax = totalDays <= 30 ? 52 : totalDays <= 45 ? 36 : 26
  const maxWidth = weeks.length * cellMax + (weeks.length - 1) * GAP
  const gridCols = `repeat(${weeks.length}, 1fr)`

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const cell = (e.target as HTMLElement).closest('[data-date]') as HTMLElement | null
    const tooltip = tooltipRef.current
    const container = containerRef.current
    if (!cell || !tooltip || !container) {
      if (tooltip) tooltip.style.display = 'none'
      return
    }
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const date = cell.dataset.date ?? ''
    const count = cell.dataset.count ?? '0'
    const formatted = new Date(date + 'T00:00:00').toLocaleDateString('default', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    tooltip.textContent = `${formatted}: ${count} achievement${count !== '1' ? 's' : ''}`
    tooltip.style.display = 'block'
    tooltip.style.left = `${x + 12}px`
    tooltip.style.top = `${y - 36}px`
  }

  function handleMouseLeave() {
    if (tooltipRef.current) tooltipRef.current.style.display = 'none'
  }

  return (
    <div
      className="flex flex-col w-full flex-1"
      role="img"
      aria-label={`Achievement activity heatmap — ${totalAch} achievements in the ${label}`}
    >
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-1 shrink-0 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Activity — {label}</p>
        <p className="text-xs font-semibold text-text-main">{isLoading ? '—' : totalAch}</p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            {/* skeleton grid */}
            <div
              className="opacity-20 animate-pulse"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(9, 1fr)`,
                gridTemplateRows: 'repeat(7, auto)',
                gridAutoFlow: 'column',
                gap: `${GAP}px`,
                width: '207px',
              }}
            >
              {Array.from({ length: 63 }).map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-sm bg-indigo-800" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-1" aria-hidden="true">
          <div
            ref={containerRef}
            className="w-full mx-auto flex flex-col gap-1 relative"
            style={{ maxWidth }}
          >
            {/* tooltip */}
            <div
              ref={tooltipRef}
              className="pointer-events-none absolute z-10 px-2 py-1 rounded text-[11px] text-white whitespace-nowrap"
              style={{
                display: 'none',
                backgroundColor: '#1e1e2e',
                border: '1px solid #3730a3',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            />

            {/* month labels */}
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: `${GAP}px` }}>
              {weeks.map((_, wi) => {
                const lbl = monthLabels.find((m) => m.col === wi)
                return (
                  <div key={wi} style={{ height: 12, overflow: 'hidden' }}>
                    {lbl && (
                      <span className="text-[8px] text-text-secondary whitespace-nowrap leading-none">
                        {lbl.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* cells */}
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
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
                      data-date={cell?.date}
                      data-count={cell?.count ?? 0}
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
      )}
    </div>
  )
}
