import { useReducedMotion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * The landing hero's entrance, for a block that rises into place `delay`
 * seconds in: spread the result on a `motion.*` element. Nothing when the
 * person asked for less motion.
 */
export function useRise() {
  const reduce = useReducedMotion()
  return (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: EASE } }
}
