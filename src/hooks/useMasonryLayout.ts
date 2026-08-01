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

  itemRefs.current.length = itemCount

  const setItemRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      itemRefs.current[index] = el
    },
    [],
  )

  const recalculate = useCallback(() => {
    const containerWidth = containerRef.current?.offsetWidth ?? 0
    const columns = effectiveColumns(containerWidth, requestedColumns)
    const colWidth = columns > 0 ? (containerWidth - gap * (columns - 1)) / columns : 0
    const colHeights = new Array(columns).fill(0)

    const next: MasonryPosition[] = []
    for (let i = 0; i < itemCount; i++) {
      const height = itemRefs.current[i]?.offsetHeight ?? 0
      let col = 0
      for (let c = 1; c < columns; c++) {
        if (colHeights[c] < colHeights[col]) col = c
      }
      next.push({ top: colHeights[col], left: col * (colWidth + gap), width: colWidth })
      colHeights[col] += height + gap
    }

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

    // A resizing item (e.g. an expanding achievement grid) fires this on every
    // animation frame. Recalculating — and retargeting every card's Framer
    // layout animation — on each of those frames is what causes the stutter,
    // so we only react once at the start of the resize and once after it settles.
    let settleTimeout: ReturnType<typeof setTimeout> | null = null
    let isResizing = false
    const handleResize = () => {
      if (!isResizing) {
        isResizing = true
        recalculate()
      }
      if (settleTimeout) clearTimeout(settleTimeout)
      settleTimeout = setTimeout(() => {
        isResizing = false
        recalculate()
      }, 120)
    }

    const observer = new ResizeObserver(handleResize)
    targets.forEach((el) => observer.observe(el))
    return () => {
      observer.disconnect()
      if (settleTimeout) clearTimeout(settleTimeout)
    }
  }, [recalculate, itemCount])

  return { containerRef, setItemRef, positions, containerHeight }
}
