'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import { groupByDays } from '@/utils/utils'
import { IconRefresh } from '@tabler/icons-react'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import { useLanguage } from '@/context/LanguageContext'
import { useHeatmapGrid, HEATMAP_GAP as GAP } from '@/hooks/useHeatmapGrid'

function cellBg(count: number): string {
  if (count === 0) return 'rgb(var(--bg-header))'
  if (count <= 2) return 'rgb(var(--accent-muted) / 0.15)'
  if (count <= 5) return 'rgb(var(--accent-muted) / 0.30)'
  if (count <= 8) return 'rgb(var(--accent-muted) / 0.45)'
  if (count <= 12) return 'rgb(var(--accent-muted) / 0.60)'
  if (count <= 18) return 'rgb(var(--accent-muted) / 0.75)'
  if (count <= 25) return 'rgb(var(--accent-muted) / 0.85)'
  return 'rgb(var(--accent-muted) / 0.95)'
}

const MONTH_ROW = 12
const LEGEND_ROW = 14

export default function MainPageHeatmap({
  achievements,
  isLoading,
  onRefresh,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
  onRefresh?: () => void
}) {
  const { T } = useLanguage()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // How many days fit is a question about the card, not about the data.
  const { weeks, cell, days } = useHeatmapGrid(boxRef)
  const label = T.cards.activityLastDays.replace('{n}', String(days))

  const { totalAch, columns, monthLabels } = useMemo(() => {
    if (!weeks) return { totalAch: 0, columns: [], monthLabels: [] }

    const data = groupByDays(achievements, days)
    const totalAch = data.reduce((s, d) => s + d.count, 0)

    // The grid ends on the last day of this week, so the days run out before
    // the final column does; the rest of it stays empty.
    const padded: (typeof data[0] | null)[] = [
      ...Array(new Date(data[0].date + 'T00:00:00').getDay()).fill(null),
      ...data,
    ]
    // Should the days not divide into the columns exactly, the oldest go: the
    // last column has to stay the current week for the grid to read as "now".
    const fitted = padded.slice(Math.max(0, padded.length - weeks * 7))
    const columns: (typeof data[0] | null)[][] = []
    for (let i = 0; i < weeks * 7; i += 7) columns.push(fitted.slice(i, i + 7))

    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = ''
    columns.forEach((week, wi) => {
      const firstReal = week.find((d) => d !== null)
      if (!firstReal) return
      const m = new Date(firstReal.date + 'T00:00:00').toLocaleString('default', { month: 'short' })
      if (m !== lastMonth) { monthLabels.push({ label: m, col: wi }); lastMonth = m }
    })

    return { totalAch, columns, monthLabels }
  }, [achievements, weeks, days])

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${weeks}, ${cell}px)`,
    gap: `${GAP}px`,
  } as const
  const gridWidth = weeks * cell + (weeks - 1) * GAP

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const cellEl = (e.target as HTMLElement).closest('[data-date]') as HTMLElement | null
    const tooltip = tooltipRef.current
    const container = containerRef.current
    if (!cellEl || !tooltip || !container) {
      if (tooltip) tooltip.style.display = 'none'
      return
    }
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const date = cellEl.dataset.date ?? ''
    const count = cellEl.dataset.count ?? '0'
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
      className="flex flex-col w-full flex-1 min-h-0"
      role="img"
      aria-label={`Achievement activity heatmap — ${totalAch} achievements in the ${label}`}
    >
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-1 shrink-0 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          {T.cards.activityLabel} — {label}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-text-main">{isLoading ? '—' : totalAch}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh heatmap"
              className="text-text-secondary hover:text-text-main disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
            >
              <IconRefresh size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/*
        The measured box. Everything inside is taken out of the flow, so the
        grid drawn from these measurements can never change them back.
      */}
      <div ref={boxRef} className="relative flex-1 min-h-0" data-testid="heatmap-box">
        {weeks > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div
              ref={containerRef}
              className="relative flex flex-col gap-1"
              style={{ width: gridWidth }}
              aria-hidden="true"
            >
              {/* tooltip */}
              <div
                ref={tooltipRef}
                className="pointer-events-none absolute z-10 px-2 py-1 rounded text-[11px] text-white whitespace-nowrap"
                style={{
                  display: 'none',
                  backgroundColor: 'rgb(var(--bg-card))',
                  border: '1px solid rgb(var(--accent-muted) / 0.5)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              />

              {/* month labels */}
              <div style={{ ...gridStyle, height: MONTH_ROW }}>
                {Array.from({ length: weeks }).map((_, wi) => {
                  const lbl = monthLabels.find((m) => m.col === wi)
                  return (
                    <div key={wi} style={{ overflow: 'visible' }}>
                      {lbl && (
                        <span className="text-[9px] text-text-secondary whitespace-nowrap leading-none">
                          {lbl.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* cells — loading draws the same grid, so nothing shifts when it fills */}
              <div
                onMouseMove={isLoading ? undefined : handleMouseMove}
                onMouseLeave={isLoading ? undefined : handleMouseLeave}
                className={isLoading ? 'animate-pulse' : ''}
                style={{ ...gridStyle, gridTemplateRows: `repeat(7, ${cell}px)`, gridAutoFlow: 'column' }}
              >
                {Array.from({ length: weeks }).flatMap((_, wi) =>
                  Array.from({ length: 7 }).map((_, di) => {
                    const day = isLoading ? null : columns[wi]?.[di] ?? null
                    const count = day?.count ?? 0
                    return (
                      <div
                        key={`${wi}-${di}`}
                        className={`rounded-sm${count > 0 ? ' cursor-pointer hover:ring-1 hover:ring-white/30' : ''}`}
                        style={{ backgroundColor: cellBg(count) }}
                        data-date={day?.date}
                        data-count={count}
                        onClick={() => day && count > 0 && setSelectedDate(day.date)}
                      />
                    )
                  })
                )}
              </div>

              {/* legend */}
              <div className="flex items-center justify-end gap-1" style={{ height: LEGEND_ROW }}>
                <span className="text-[9px] text-text-secondary">Less</span>
                {[0, 1, 3, 6, 10].map((v) => (
                  <div key={v} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cellBg(v) }} />
                ))}
                <span className="text-[9px] text-text-secondary">More</span>
              </div>
            </div>
          </div>
        )}
      </div>

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
