'use client'

import { useId, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconPlus } from '@tabler/icons-react'

const EASE = [0.4, 0, 0.2, 1] as const

/**
 * One question that slides its answer open and shut: the library's disclosure.
 * The content stays in the page while closed (height 0 and inert, not
 * unmounted), so it is in the HTML a search engine reads. Instant with reduced
 * motion. A stack of them is a list of these in a column; each opens alone.
 */
export default function AccordionItem({
  title,
  index,
  defaultOpen = false,
  children,
  className = '',
}: {
  /** The question: what is always shown. */
  title: ReactNode
  /** Its place in a list, shown as 01, 02…; none draws no number. */
  index?: number
  defaultOpen?: boolean
  /** The answer. */
  children: ReactNode
  /** Layout only. */
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.35

  return (
    <div
      className={`relative overflow-hidden rounded-card ring-1 transition-[background-color,box-shadow] duration-300 ${
        open ? 'bg-bg-card ring-accent/40 shadow-lg shadow-accent/10' : 'bg-bg-card/60 ring-ink/[0.06] hover:bg-bg-card hover:ring-ink/15'
      } ${className}`}
    >
      <div aria-hidden="true" className={`absolute left-0 inset-y-0 w-1 bg-accent transition-transform duration-300 origin-top ${open ? 'scale-y-100' : 'scale-y-0'}`} />
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
        >
          {index !== undefined && (
            <span aria-hidden="true" className={`text-xs font-mono tabular-nums transition-colors ${open ? 'text-accent' : 'text-text-secondary'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
          <span className="flex-1 font-semibold">{title}</span>
          <span
            aria-hidden="true"
            className={`shrink-0 grid place-items-center size-8 rounded-full transition-all duration-300 ${
              open ? 'bg-accent text-bg-main rotate-45' : 'bg-bg-main ring-1 ring-ink/10 text-text-secondary'
            }`}
          >
            <IconPlus size={16} />
          </span>
        </button>
      </h3>
      <motion.div
        id={id}
        inert={!open}
        initial={false}
        animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration, ease: EASE }}
        className="overflow-hidden"
      >
        <motion.div
          initial={false}
          animate={{ y: open ? 0 : -6 }}
          transition={{ duration, ease: EASE }}
          className={`${index !== undefined ? 'pl-14' : 'pl-5'} pr-5 pb-5 text-sm sm:text-base text-text-secondary leading-relaxed`}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}
