import { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/** How long the top is held in place while what was opened loads. */
export const SETTLE_MS = 3000
/** The user moving the page themselves: from then on, they lead. */
const USER_EVENTS = ['wheel', 'touchstart', 'keydown'] as const

/**
 * Brings an element's top into view (just under the sticky header, through its
 * scroll-mt) and keeps it there while what is inside settles. A section that
 * loads once opened (Following) is short at first: the page may not be tall
 * enough to scroll that far, and it grows afterwards. So while it resizes the
 * scroll is asked again, for SETTLE_MS, until the user scrolls on their own.
 */
export function useSectionScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const reduceMotion = useReducedMotion()
  const stop = useRef<(() => void) | null>(null)

  useEffect(() => () => stop.current?.(), [])

  const scrollToTop = useCallback(() => {
    stop.current?.()
    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'
    const go = () => ref.current?.scrollIntoView({ behavior, block: 'start' })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => go())
    const cancel = () => stop.current?.()
    const timer = setTimeout(cancel, SETTLE_MS)
    for (const e of USER_EVENTS) window.addEventListener(e, cancel, { passive: true })
    stop.current = () => {
      observer?.disconnect()
      clearTimeout(timer)
      for (const e of USER_EVENTS) window.removeEventListener(e, cancel)
      stop.current = null
    }
    // On the next frame, once the new panel is laid out.
    requestAnimationFrame(() => {
      go()
      if (ref.current) observer?.observe(ref.current)
    })
  }, [reduceMotion])

  return { ref, scrollToTop }
}
