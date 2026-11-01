import { flushSync } from 'react-dom'
import type { ShapeStyle } from '@/hooks/useShapeStyle'

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** Gentle on purpose: a steeper curve idles out of the window, then crosses the dialog in six frames (measured 2026-11-01). */
const EASE_SINE = 'cubic-bezier(0.37, 0, 0.63, 1)'
/** The band of the accent that leads a sweep, and the trail behind it that hides its steps from one frame to the next, in px. */
const BAND = 24
const TRAIL = 140

type Reveal = {
  keyframes: PropertyIndexedKeyframes
  /** What the old look does, when it does not simply stay under the new one. */
  old?: PropertyIndexedKeyframes
  duration: number
  easing: string
}

/** The new look fades in over the old one. */
const FADE: Reveal = { keyframes: { opacity: [0, 1], filter: ['blur(3px)', 'blur(0)'] }, duration: 320, easing: EASE_OUT }

/** The new look spreads from a point to the farthest corner of the window. */
export function spreadFrom(x: number, y: number): Reveal {
  const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  return { keyframes: { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${reach}px at ${x}px ${y}px)`] }, duration: 650, easing: EASE_OUT }
}

/**
 * The new look sweeps across the window behind a band of the accent, shaped like
 * it: leaning for the slanted design (the 12° of a button), curved for the round
 * one. The band shows through between the two looks, from the background of
 * the view transition's pair (globals.css): they differ too little for a bare
 * edge to be seen. The page changes whole, so nothing jumps, as it did when only
 * the corners eased (the bars' `clip-path` cannot ease into `none`).
 */
export function sweepEdge(shape: ShapeStyle): Reveal {
  const { innerWidth: w, innerHeight: h } = window
  const curve = h * 1.2
  const [ahead, behind] =
    shape === 'round'
      ? [
          `radial-gradient(circle ${curve}px at calc(50% - ${curve}px) 50%, #000 ${curve - TRAIL}px, transparent ${curve}px), linear-gradient(#000, #000)`,
          `radial-gradient(circle ${curve + BAND + 2}px at calc(50% - ${curve}px) 50%, transparent ${curve + BAND}px, #000 ${curve + BAND + 2}px)`,
        ]
      : [
          `linear-gradient(102deg, #000 calc(50% - ${TRAIL}px), transparent 50%), linear-gradient(#000, #000)`,
          `linear-gradient(102deg, transparent calc(50% + ${BAND}px), #000 calc(50% + ${BAND + 2}px))`,
        ]
  // How far the edge's ends lag behind its middle, so it starts and ends just out of the window, with no idle time.
  const lag = h * 0.12
  const [from, to] = [-(BAND + lag), w + TRAIL + lag]
  // The middle of the mask rides on the edge: only as wide as that takes and as tall as the window, since a bigger one is slower to draw.
  const wide = 2 * to
  // Its second layer is solid behind the arc: the corners a circle leaves out would show the band's colour, more so on a wide window.
  const solid = Math.max(0, wide / 2 - curve)
  const size = `${wide}px ${h}px, ${solid}px ${h}px`
  const edgeAt = (x: number) => `${x - wide / 2}px 0`
  const mask = (image: string) => ({
    maskImage: [image, image],
    maskSize: [size, size],
    maskRepeat: ['no-repeat', 'no-repeat'],
    maskPosition: [edgeAt(from), edgeAt(to)],
  })
  return { keyframes: mask(ahead), old: mask(behind), duration: 1000, easing: EASE_SINE }
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
