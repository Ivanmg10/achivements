'use client'

import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

const SHELF: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
}
const TITLE: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

/** A titled group of cards, with an optional action to see the whole group. */
export default function Shelf({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: { label: string; onClick: () => void }
  children: ReactNode
}) {
  return (
    <motion.section aria-label={title} variants={SHELF} className="flex flex-col gap-3">
      <motion.div variants={TITLE} className="flex items-baseline gap-x-3 gap-y-0.5 flex-wrap">
        <h2 className="text-base font-bold">{title}</h2>
        {hint && <p className="text-xs text-text-secondary">{hint}</p>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="ml-auto text-xs text-text-secondary hover:text-text-main underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {action.label}
          </button>
        )}
      </motion.div>
      {children}
    </motion.section>
  )
}
