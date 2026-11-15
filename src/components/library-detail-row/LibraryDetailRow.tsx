'use client'

import { useId, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import ExpandPanel from '@/components/expand-panel/ExpandPanel'

/**
 * The opened detail of a game in a status list, as its own row of the grid:
 * the whole width however many columns the cards use. It sits right after
 * its card, so the grid must flow densely — the cards after it fill the gaps
 * beside the one that opened, and the detail takes the row below.
 *
 * It opens by growing and settling into place; what is inside enters on its
 * own (see LibraryGameDetail). With reduced motion it simply appears.
 */
export default function LibraryDetailRow({
  open,
  id,
  title,
  children,
}: {
  open: boolean
  /** The id the card's expand button points at. */
  id: string
  title: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const headingId = useId()

  return (
    <ExpandPanel open={open} id={id} className="col-span-full" duration={0.45}>
      <motion.section
        aria-labelledby={headingId}
        style={{ transformOrigin: 'top center' }}
        initial={reduce ? false : { y: -16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="flex flex-col gap-3 rounded-card bg-bg-card p-4 sm:p-5 ring-1 ring-accent/30 shadow-lg shadow-black/10"
      >
        <h3 id={headingId} className="text-sm font-semibold text-text-main truncate">{title}</h3>
        {children}
      </motion.section>
    </ExpandPanel>
  )
}
