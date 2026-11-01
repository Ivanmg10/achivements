import { flushSync } from 'react-dom'
import type { ShapeStyle } from '@/hooks/useShapeStyle'

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'
/** The width of the band in the accent that leads a sweep, in px. */
const BAND = 20

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
  const box = 2 * (w + h)
  const curve = h * 1.2
  const [ahead, behind] =
    shape === 'round'
      ? [
          `radial-gradient(circle ${curve}px at calc(50% - ${curve}px) 50%, #000 100%, transparent 100%)`,
          `radial-gradient(circle ${curve + BAND}px at calc(50% - ${curve}px) 50%, transparent 100%, #000 100%)`,
        ]
      : ['linear-gradient(102deg, #000 50%, transparent 50%)', `linear-gradient(102deg, transparent calc(50% + ${BAND}px), #000 calc(50% + ${BAND}px))`]
  // The middle of the mask rides on the edge, from out of the window on one side to out of it on the other.
  const past = h / 4 + BAND
  const edgeAt = (x: number) => `${x - box / 2}px ${(h - box) / 2}px`
  const mask = (image: string) => ({
    maskImage: [image, image],
    maskSize: [`${box}px ${box}px`, `${box}px ${box}px`],
    maskRepeat: ['no-repeat', 'no-repeat'],
    maskPosition: [edgeAt(-past), edgeAt(w + past)],
  })
  return { keyframes: mask(ahead), old: mask(behind), duration: 750, easing: EASE_IN_OUT }
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
