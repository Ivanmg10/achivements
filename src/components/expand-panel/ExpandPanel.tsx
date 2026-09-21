'use client'

import { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const EASE = [0.4, 0, 0.2, 1] as const

/**
 * Content that slides open and shut (height and fade) instead of popping in:
 * a card's achievement grid, a section's list. Unmounted while closed, like
 * the `{open && …}` it replaces. Clips only while moving, so rings and
 * tooltips inside are not cut off once open. Instant with reduced motion.
 */
export default function ExpandPanel({
  open,
  id,
  className = '',
  children,
}: {
  open: boolean
  id?: string
  className?: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.3

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="panel"
          id={id}
          className={className}
          initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
          animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
          exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
          transition={{ duration, ease: EASE }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
