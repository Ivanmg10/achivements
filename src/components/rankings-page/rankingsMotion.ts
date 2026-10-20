import type { Variants } from 'framer-motion'

/**
 * How the rankings come in: the podium rises third, second, first; then the
 * rows one after another (the stagger stops after a few, so a long page is not
 * slow to fill); the side panel slides in. Under reduced motion only the fades
 * play (MotionConfig in RankingsPage).
 */
const EASE = [0.16, 1, 0.3, 1] as const

/** Delay of each podium place: the first arrives last. */
export const PODIUM_DELAY: Record<number, number> = { 3: 0, 2: 0.12, 1: 0.24 }

export const PODIUM_CARD: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: (place: number) => ({ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22, delay: PODIUM_DELAY[place] ?? 0 } }),
}

export const PODIUM_STEP: Variants = {
  hidden: { scaleY: 0 },
  show: (place: number) => ({ scaleY: 1, transition: { duration: 0.6, ease: EASE, delay: 0.25 + (PODIUM_DELAY[place] ?? 0) } }),
}

export const ROW: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE, delay: 0.35 + Math.min(i, 14) * 0.035 } }),
}

export const SIDE: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE, delay: 0.15 } },
}

export const ME_BAR: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24, delay: 0.7 } },
}
