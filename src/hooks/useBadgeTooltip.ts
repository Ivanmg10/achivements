import { useEffect, useRef, useState } from 'react'

const TOOLTIP_DELAY_MS = 450

type Shown<T> = { item: T; x: number; y: number }

/**
 * The tooltip of a grid of badges: it appears after a short hover (or at once on focus), follows one
 * badge at a time and goes on leave or blur. The timer never outlives the grid.
 */
export function useBadgeTooltip<T>() {
  const [tip, setTip] = useState<Shown<T> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function show(item: T, x: number, y: number, delay = TOOLTIP_DELAY_MS) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTip({ item, x, y }), delay)
  }

  function hide() {
    clearTimeout(timer.current)
    setTip(null)
  }

  return { tip, show, hide }
}
