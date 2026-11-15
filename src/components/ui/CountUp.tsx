'use client'

import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/**
 * A number that counts up to its value when it appears or changes, written
 * straight to the DOM (no re-render per frame). The final value is in the
 * markup from the first render, so screen readers, tests and no-JS all read
 * the real number; with reduced motion it simply stays there.
 */
export function CountUp({
  value,
  duration = 0.9,
  delay = 0,
  locale,
  format,
  className = '',
}: {
  value: number
  duration?: number
  delay?: number
  locale?: string
  /** How to write the number, for one with words around it ("12 days"). */
  format?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const write = useRef(format)
  const reduce = useReducedMotion()

  useEffect(() => {
    write.current = format
  })

  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    const controls = animate(from.current, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        const n = Math.round(v)
        el.textContent = write.current ? write.current(n) : n.toLocaleString(locale)
      },
    })
    from.current = value
    return () => controls.stop()
  }, [value, duration, delay, locale, reduce])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {format ? format(value) : value.toLocaleString(locale)}
    </span>
  )
}
