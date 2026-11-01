import { flushSync } from 'react-dom'
import type { ShapeStyle } from '@/hooks/useShapeStyle'

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** Gentle on purpose: a steeper curve idles out of the window, then crosses the dialog in six frames (measured 2026-11-01). */
const EASE_SINE = 'cubic-bezier(0.37, 0, 0.63, 1)'
/** The band of the accent that leads a sweep, in px, wide enough that no frame jumps clear of itself. */
const BAND = 40
/** The tilt of a button, -12deg, as a slanted edge's lean across its height. */
const LEAN = Math.tan((12 * Math.PI) / 180)
/** Points along a sweep's edge: enough for its curve to read as one. */
const EDGE_POINTS = 32

type Reveal = {
  keyframes: PropertyIndexedKeyframes
  /** What the old look does, when it does not simply stay under the new one. */
  old?: PropertyIndexedKeyframes
  duration: number
  easing: string
}

/** The new look fades in over the old one; what did not change does not move. */
const FADE: Reveal = { keyframes: { opacity: [0, 1] }, duration: 320, easing: EASE_OUT }

/** The new look spreads from a point to the farthest corner of the window. */
export function spreadFrom(x: number, y: number): Reveal {
  const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  return { keyframes: { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${reach}px at ${x}px ${y}px)`] }, duration: 650, easing: EASE_OUT }
}

/**
 * The new look sweeps across the window behind a band of the accent, shaped like
 * it: leaning for the slanted design, curved for the round one. The two looks
 * are clipped apart and the band is what shows between them, the background of
 * the view transition's pair (globals.css): they differ too little for a bare
 * edge to be seen. The page changes whole, so nothing jumps, as it did when only
 * the corners eased (the bars' own `clip-path` cannot ease into `none`).
 */
export function sweepEdge(shape: ShapeStyle): Reveal {
  const { innerWidth: w, innerHeight: h } = window
  const radius = h * 1.2
  const offset = (y: number) => (shape === 'round' ? Math.sqrt(radius ** 2 - (y - h / 2) ** 2) - radius : (h / 2 - y) * LEAN)
  const ys = Array.from({ length: EDGE_POINTS + 1 }, (_, i) => (h * i) / EDGE_POINTS)
  const edge = (x: number) => ys.map((y) => `${x + offset(y)}px ${y}px`).join(', ')
  // Both looks reach far past the window, so no end of theirs ever shows.
  const beyond = w + h
  const behind = (x: number) => `polygon(${-beyond}px 0, ${edge(x)}, ${-beyond}px ${h}px)`
  const ahead = (x: number) => `polygon(${w + beyond}px 0, ${edge(x + BAND)}, ${w + beyond}px ${h}px)`
  // The edge's ends lag its middle by up to this, so it starts and ends just out of the window, with no idle time.
  const lag = h * 0.12
  const [from, to] = [-(BAND + lag), w + lag]
  return { keyframes: { clipPath: [behind(from), behind(to)] }, old: { clipPath: [ahead(from), ahead(to)] }, duration: 1000, easing: EASE_SINE }
}

/**
 * A change of the site's look through the browser's view transition, for what
 * CSS cannot ease on its own. A browser without view transitions, or reduced
 * motion, just changes.
 */
export function lookTransition(change: () => void, reveal: Reveal = FADE) {
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    change()
    return
  }
  const transition = document.startViewTransition(() => flushSync(change))
  transition.ready
    .then(() => {
      const timing = { duration: reveal.duration, easing: reveal.easing }
      document.documentElement.animate(reveal.keyframes, { ...timing, pseudoElement: '::view-transition-new(root)' })
      if (reveal.old) document.documentElement.animate(reveal.old, { ...timing, pseudoElement: '::view-transition-old(root)' })
    })
    // Skipped (a hidden tab, another transition): the change itself already happened.
    .catch(() => {})
}
