import { flushSync } from 'react-dom'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * A change of the site's look through the browser's view transition, for what
 * CSS cannot ease on its own. With `from` (a point on screen) the new look
 * spreads out from there; without it, it fades in over the old one. A browser
 * without view transitions, or reduced motion, just changes.
 */
export function lookTransition(change: () => void, from?: { x: number; y: number }) {
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    change()
    return
  }
  const transition = document.startViewTransition(() => flushSync(change))
  transition.ready
    .then(() => {
      const keyframes = from
        ? { clipPath: [`circle(0 at ${from.x}px ${from.y}px)`, `circle(${reach(from)}px at ${from.x}px ${from.y}px)`] }
        : { opacity: [0, 1], filter: ['blur(3px)', 'blur(0)'] }
      document.documentElement.animate(keyframes, { duration: from ? 650 : 320, easing: EASE, pseudoElement: '::view-transition-new(root)' })
    })
    // Skipped (a hidden tab, another transition): the change itself already happened.
    .catch(() => {})
}

/** How far the farthest corner of the window is from a point. */
function reach({ x, y }: { x: number; y: number }) {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
}
