import type { CSSProperties } from 'react'

/** The widest an achievement tooltip gets (max-w-65 = 260px), and a generous guess at its tallest. */
const TOOLTIP_MAX_WIDTH = 260
const TOOLTIP_EST_HEIGHT = 190
const GAP = 14

/**
 * Where a hover tooltip goes: beside the pointer, to its right and just above
 * it, unless that would run off the screen — then to its left, or below it. The
 * flip is done with a transform, so it does not depend on the tooltip's real size.
 */
export function tooltipStyle(x: number, y: number, viewportWidth: number, viewportHeight: number): CSSProperties {
  const left = x + GAP + TOOLTIP_MAX_WIDTH > viewportWidth
  const up = y - 10 + TOOLTIP_EST_HEIGHT > viewportHeight
  return {
    left: left ? x - GAP : x + GAP,
    top: up ? y + 10 : y - 10,
    transform: `translate(${left ? '-100%' : '0'}, ${up ? '-100%' : '0'})`,
  }
}
