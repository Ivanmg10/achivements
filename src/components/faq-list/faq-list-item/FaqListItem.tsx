'use client'

import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconPlus } from '@tabler/icons-react'
import type { FaqItem } from '@/translations/seoPages'

const EASE = [0.4, 0, 0.2, 1] as const

/**
 * One question that slides its answer open and shut. The answer stays in the
 * page while closed (height 0 and inert, not unmounted), so it is in the HTML
 * search engines read. Instant with reduced motion.
 */
export default function FaqListItem({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.35

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ring-1 transition-[background-color,box-shadow] duration-300 ${
        open ? 'bg-bg-card ring-accent/40 shadow-lg shadow-accent/10' : 'bg-bg-card/60 ring-ink/[0.06] hover:bg-bg-card hover:ring-ink/15'
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute left-0 inset-y-0 w-1 bg-accent transition-transform duration-300 origin-top ${open ? 'scale-y-100' : 'scale-y-0'}`}
      />
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-4 px-5 py-4 text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
        >
          <span aria-hidden="true" className={`text-xs font-mono tabular-nums transition-colors ${open ? 'text-accent' : 'text-text-secondary'}`}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="flex-1 font-semibold">{item.q}</span>
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
        <motion.p
          initial={false}
          animate={{ y: open ? 0 : -6 }}
          transition={{ duration, ease: EASE }}
          className="pl-14 pr-5 pb-5 text-sm sm:text-base text-text-secondary leading-relaxed"
        >
          {item.a}
        </motion.p>
      </motion.div>
    </div>
  )
}
