import { useEffect, useState, type RefObject } from 'react'

/** Where a pinned (sticky) box sits from the top of the screen once the page has scrolled to it, in px. */
const STUCK_AT = 16

/**
 * The height that takes a box from where it starts to the bottom of the screen,
 * so it fills what is visible and no more: not cut off at the bottom when the
 * page is at the top, not short when it has scrolled. Measured from `ref`, the
 * box's own block (its top, never above where a sticky one stops), and kept up
 * to date as the page scrolls and the window changes.
 *
 * Undefined until measured, and when `enabled` is false (a narrow screen has no
 * side by side to fill), so the caller keeps its own sizing meanwhile.
 */
export function useFillViewport(ref: RefObject<HTMLElement | null>, enabled: boolean, { bottom = 16, min = 360 } = {}): number | undefined {
  const [height, setHeight] = useState<number>()

  useEffect(() => {
    if (!enabled) return
    let frame = 0
    const update = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const top = Math.max(el.getBoundingClientRect().top, STUCK_AT)
      setHeight(Math.max(min, Math.round(window.innerHeight - top - bottom)))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [enabled, ref, bottom, min])

  return enabled ? height : undefined
}
