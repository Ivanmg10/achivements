import { RefObject, useEffect, useState } from 'react'

/** Gap between cells, in px. Shared with the component that draws them. */
export const HEATMAP_GAP = 3

const ROWS = 7
const MIN_CELL = 7
const MAX_CELL = 30
const MIN_WEEKS = 6
/** How much wider than tall a cell may grow to fill the card. */
const MAX_STRETCH = 1.5

/** As far back as both platforms are fetched — a year, in whole weeks. */
export const HEATMAP_MAX_DAYS = 365
const MAX_WEEKS = Math.ceil(HEATMAP_MAX_DAYS / 7)

export type HeatmapGrid = {
  /** Columns to draw. 0 until the box has been measured. */
  weeks: number
  /** Height of a cell, in px. */
  cell: number
  /** Width of a cell: its height, or a little more when that leaves the card unfilled. */
  cellWidth: number
  /** Days of history the columns cover, ending today. */
  days: number
}

export const UNMEASURED: HeatmapGrid = { weeks: 0, cell: 0, cellWidth: 0, days: 0 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * The biggest grid that fits a box, and how much history it can therefore
 * show. The height fixes the cell — seven rows always, since a week is seven
 * days — and the width then decides how many weeks fit beside each other.
 *
 * So the card is filled in both directions instead of holding a small square
 * in the middle, and a wider card shows more days rather than bigger days.
 * Past a year there are no more days to show: what is left of a short, wide
 * card goes to the cells' width, or it would hold a small grid between two gaps.
 *
 * `todayDow` is today's weekday (0 = Sunday): the last column is the current
 * week, so the days counted back stop short by whatever is left of it.
 */
export function measureHeatmapGrid(width: number, height: number, todayDow: number): HeatmapGrid {
  if (width <= 0 || height <= 0) return UNMEASURED

  const cell = clamp(Math.floor((height - (ROWS - 1) * HEATMAP_GAP) / ROWS), MIN_CELL, MAX_CELL)
  const weeks = clamp(Math.floor((width + HEATMAP_GAP) / (cell + HEATMAP_GAP)), MIN_WEEKS, MAX_WEEKS)
  const days = Math.min(HEATMAP_MAX_DAYS, weeks * ROWS - (6 - todayDow))
  const cellWidth = clamp(Math.floor((width + HEATMAP_GAP) / weeks) - HEATMAP_GAP, cell, Math.floor(cell * MAX_STRETCH))

  return { weeks, cell, cellWidth, days }
}

/**
 * Keeps a heatmap sized to its box. The box is measured, never the grid, so
 * growing the grid can never grow the box that decides how big the grid is.
 *
 * `reserved` is the height drawn around the grid inside the same box (month
 * names, legend): left out of the cells, or a short box overflows into the
 * card's header.
 */
export function useHeatmapGrid(ref: RefObject<HTMLElement | null>, reserved = 0): HeatmapGrid {
  const [grid, setGrid] = useState<HeatmapGrid>(UNMEASURED)

  useEffect(() => {
    const box = ref.current
    if (!box) return

    const measure = () =>
      setGrid((prev) => {
        const next = measureHeatmapGrid(box.clientWidth, box.clientHeight - reserved, new Date().getDay())
        return next.weeks === prev.weeks && next.cell === prev.cell && next.cellWidth === prev.cellWidth ? prev : next
      })

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [ref, reserved])

  return grid
}
