import { useLayoutEffect, useState } from 'react'

/** How many rows of `row` px fit in `box` px: at least `min`, so a card never shows none. */
export function fitCount(box: number, row: number, min: number): number {
  if (!box || !row) return min
  return Math.max(min, Math.floor(box / row))
}

/**
 * How many equal rows a list's box holds, following it as it resizes: the box
 * (the ref) is as tall as its card makes it, and the rows are its children,
 * the first one measured. `fallback` until it has been measured (and on the
 * server). For a card that must fill the height its row gives it. Measured in a
 * layout effect, before the first paint, so no row pops in after it. The ref is a
 * callback, so a box swapped for another (a skeleton's rows for the loaded list)
 * is measured and followed too.
 */
export function useFitCount<T extends HTMLElement>(fallback: number, min = 1) {
  const [box, ref] = useState<T | null>(null)
  const [count, setCount] = useState(fallback)
  useLayoutEffect(() => {
    if (!box || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const row = box.firstElementChild as HTMLElement | null
      if (row?.offsetHeight) setCount(fitCount(box.clientHeight, row.offsetHeight, min))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [box, min])
  return [ref, count] as const
}
