import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export type MasonryPosition = { top: number; left: number; width: number }

const BREAKPOINT_MOBILE = 768
const BREAKPOINT_LG = 1024

function effectiveColumns(containerWidth: number, requestedColumns: number): number {
  if (containerWidth < BREAKPOINT_MOBILE) return 1
  if (containerWidth < BREAKPOINT_LG) return Math.min(requestedColumns, 2)
  return requestedColumns
}

export function useMasonryLayout(itemCount: number, requestedColumns: number, gap: number = 12) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [positions, setPositions] = useState<MasonryPosition[]>([])
  const [containerHeight, setContainerHeight] = useState(0)
  const assignment = useRef<{ key: string; cols: number[]; measured: boolean } | null>(null)

  const setItemRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      itemRefs.current[index] = el
    },
    [],
  )

  const recalculate = useCallback(() => {
    // Forget refs of items that are gone (done here, not during render).
    itemRefs.current.length = itemCount
    const containerWidth = containerRef.current?.offsetWidth ?? 0
    const columns = effectiveColumns(containerWidth, requestedColumns)
    const colWidth = columns > 0 ? (containerWidth - gap * (columns - 1)) / columns : 0
    const colHeights = new Array(columns).fill(0)
    const heights = Array.from({ length: itemCount }, (_, i) => itemRefs.current[i]?.offsetHeight ?? 0)

    // Each item keeps its column while only heights change (a card opening or
    // closing): re-picking the shortest column on every frame of that made
    // cards hop between columns mid-animation. Columns are chosen again when
    // the list or the column count changes, or once every item has a height.
    const key = `${itemCount}:${columns}`
    const kept = assignment.current
    const reuse = kept && kept.key === key && kept.measured
    const cols: number[] = reuse ? kept.cols : []
    const next: MasonryPosition[] = []
    for (let i = 0; i < itemCount; i++) {
      let col = cols[i]
      if (!reuse) {
        col = 0
        for (let c = 1; c < columns; c++) {
          if (colHeights[c] < colHeights[col]) col = c
        }
        cols[i] = col
      }
      next.push({ top: colHeights[col], left: col * (colWidth + gap), width: colWidth })
      colHeights[col] += heights[i] + gap
    }
    if (!reuse) assignment.current = { key, cols, measured: heights.every((h) => h > 0) }

    setPositions(next)
    setContainerHeight(itemCount === 0 ? 0 : Math.max(0, ...colHeights) - gap)
  }, [itemCount, requestedColumns, gap])

  useLayoutEffect(() => {
    recalculate()
  }, [recalculate])

  useEffect(() => {
    const targets = [containerRef.current, ...itemRefs.current].filter(
      (el): el is HTMLDivElement => el !== null,
    )
    if (targets.length === 0) return

    // A card opening or closing resizes on every animation frame; the cards
    // below follow it frame by frame (at most one layout pass per frame), so
    // they slide along instead of jumping when it settles or overlapping it.
    let frame = 0
    const handleResize = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        recalculate()
      })
    }

    const observer = new ResizeObserver(handleResize)
    targets.forEach((el) => observer.observe(el))
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [recalculate, itemCount])

  return { containerRef, setItemRef, positions, containerHeight }
}
