'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import { groupByDays, heatLevel, HEAT_LEVELS } from '@/utils/utils'
import { IconRefresh } from '@tabler/icons-react'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import { useLanguage } from '@/context/LanguageContext'
import { useHeatmapGrid, HEATMAP_GAP as GAP } from '@/hooks/useHeatmapGrid'

/** Empty, then the theme's accent at rising strength: one hue per theme, so every theme reads the same way. */
const LEVEL_BG = [
  'rgb(var(--bg-header))',
  'rgb(var(--accent) / 0.22)',
  'rgb(var(--accent) / 0.42)',
  'rgb(var(--accent) / 0.68)',
  'rgb(var(--accent) / 0.95)',
]

const MONTH_ROW = 14
const LEGEND_ROW = 14
/** gap-1 between the month row, the cells and the legend. */
const ROW_GAP = 4

/** Columns a month needs before its name fits above it without overlapping. */
const MIN_LABEL_COLS = 3

export default function MainPageHeatmap({
  achievements,
  isLoading,
  onRefresh,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
  onRefresh?: () => void
}) {
  const { T, lang } = useLanguage()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // How many days fit is a question about the card, not about the data.
  const { weeks, cell, days } = useHeatmapGrid(boxRef, MONTH_ROW + LEGEND_ROW + 2 * ROW_GAP)
  const label = T.cards.activityLastDays.replace('{n}', String(days))

  const { totalAch, activeDays, best, columns, monthLabels } = useMemo(() => {
    if (!weeks) return { totalAch: 0, activeDays: 0, best: 0, columns: [], monthLabels: [] }

    const data = groupByDays(achievements, days)
    const totalAch = data.reduce((s, d) => s + d.count, 0)
    const activeDays = data.filter((d) => d.count > 0).length
    const best = Math.max(0, ...data.map((d) => d.count))

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

    const starts: { label: string; col: number }[] = []
    let lastMonth = ''
    columns.forEach((week, wi) => {
      const firstReal = week.find((d) => d !== null)
      if (!firstReal) return
      const m = new Date(firstReal.date + 'T00:00:00').toLocaleString('default', { month: 'short' })
      if (m !== lastMonth) { starts.push({ label: m, col: wi }); lastMonth = m }
    })

    // The first column is rarely the first of its month, so that month can own
    // a single column and print its name on top of the next one's. A month too
    // narrow to be labelled without colliding goes unlabelled.
    const monthLabels = starts.filter(
      (start, i) => i === 0 ? (starts[1]?.col ?? MIN_LABEL_COLS) - start.col >= MIN_LABEL_COLS : true,
    )

    return { totalAch, activeDays, best, columns, monthLabels }
  }, [achievements, weeks, days])

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${weeks}, ${cell}px)`,
    gap: `${GAP}px`,
  } as const
  const gridWidth = weeks * cell + (weeks - 1) * GAP
  const today = new Date().toISOString().split('T')[0]

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
    const formatted = new Date(date + 'T00:00:00').toLocaleDateString(lang, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
    tooltip.textContent = `${formatted}: ${count === '1' ? T.lineChart.oneAchievement : `${count} ${T.lineChart.achievements}`}`
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
      aria-label={`${T.cards.activityLabel} — ${label}: ${totalAch} ${T.lineChart.achievements}`}
    >
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-1 shrink-0 mb-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">
          {T.cards.activityLabel} — {label}
        </p>
        <div className="flex items-center gap-3">
          {!isLoading && activeDays > 0 && (
            <p className="text-[11px] text-text-secondary">
              {T.cards.activeDays.replace('{n}', String(activeDays))} · {T.lineChart.bestDay.replace('{n}', String(best))}
            </p>
          )}
          <p className="text-sm font-bold tabular-nums text-text-main">{isLoading ? '—' : totalAch}</p>
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
      {/* min-h: stacked on a phone nothing else gives the box a height, and an unmeasured box draws no grid. */}
      <div ref={boxRef} className="relative flex-1 min-h-36" data-testid="heatmap-box">
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
                className="pointer-events-none absolute z-10 px-2 py-1 rounded text-[11px] text-text-main whitespace-nowrap"
                style={{
                  display: 'none',
                  backgroundColor: 'rgb(var(--bg-card))',
                  border: '1px solid rgb(var(--accent-muted) / 0.5)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              />

              {/*
                Placed over the row rather than inside its columns: a name is
                wider than the column its month starts in, and a grid cell
                clipped it to a couple of letters.
              */}
              <div className="relative" style={{ height: MONTH_ROW }}>
                {monthLabels.map(({ label, col }) => (
                  <span
                    key={col}
                    className="absolute top-0 text-[10px] font-medium text-text-secondary capitalize whitespace-nowrap leading-none"
                    style={{ left: Math.min(col * (cell + GAP), Math.max(0, gridWidth - 26)) }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/*
                cells — loading draws the same grid, so nothing shifts when it
                fills, with a wave of the accent running across it diagonally
                (oldest corner to today); then the real cells come in.
              */}
              <div
                onMouseMove={isLoading ? undefined : handleMouseMove}
                onMouseLeave={isLoading ? undefined : handleMouseLeave}
                style={{ ...gridStyle, gridTemplateRows: `repeat(7, ${cell}px)`, gridAutoFlow: 'column' }}
              >
                {Array.from({ length: weeks }).flatMap((_, wi) =>
                  Array.from({ length: 7 }).map((_, di) => {
                    const day = isLoading ? null : columns[wi]?.[di] ?? null
                    const count = day?.count ?? 0
                    const isToday = day?.date === today
                    return (
                      <div
                        key={`${wi}-${di}`}
                        className={
                          isLoading
                            ? 'heat-loading rounded-[3px]'
                            : `heat-cell rounded-[3px] transition-transform${count > 0 ? ' cursor-pointer hover:scale-125 hover:ring-1 hover:ring-text-main/40' : ''}${isToday ? ' ring-1 ring-text-main/70' : ''}`
                        }
                        style={{ backgroundColor: isLoading ? undefined : LEVEL_BG[heatLevel(count, best)], '--col': wi, '--row': di } as React.CSSProperties}
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
                <span className="text-[9px] text-text-secondary">{T.cards.heatLess}</span>
                {Array.from({ length: HEAT_LEVELS + 1 }, (_, level) => (
                  <div key={level} className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: LEVEL_BG[level] }} />
                ))}
                <span className="text-[9px] text-text-secondary">{T.cards.heatMore}</span>
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
