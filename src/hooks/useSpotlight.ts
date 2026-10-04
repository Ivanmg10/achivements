import { useCallback } from 'react'
import type { PointerEvent } from 'react'

/**
 * Feeds the pointer position to a `.spotlight` element as CSS variables, so
 * the glow in globals.css follows the cursor. Written straight to the style:
 * no state, no re-render per mouse move.
 */
export function useSpotlight() {
  return useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }, [])
}
