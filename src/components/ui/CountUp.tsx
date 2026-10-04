'use client'

import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/**
 * A number that counts up to its value when it appears or changes, written
 * straight to the DOM (no re-render per frame). The final value is in the
 * markup from the first render, so screen readers, tests and no-JS all read
 * the real number; with reduced motion it simply stays there.
 */
export function CountUp({ value, duration = 0.9, className = '' }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString()
      },
    })
    from.current = value
    return () => controls.stop()
  }, [value, duration, reduce])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value.toLocaleString()}
    </span>
  )
}
