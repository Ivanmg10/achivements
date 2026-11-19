'use client'

import { useId, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconPlus } from '@tabler/icons-react'

const EASE = [0.4, 0, 0.2, 1] as const

/** Its colour: the accent (a question), or danger (a warning folded away, such as the missables of a game). */
const TONE = {
  accent: {
    open: 'bg-bg-card ring-accent/40 shadow-lg shadow-accent/10',
    closed: 'bg-bg-card/60 ring-ink/[0.06] hover:bg-bg-card hover:ring-ink/15',
    bar: 'bg-accent',
    plus: 'bg-accent text-bg-main',
    index: 'text-accent',
    focus: 'focus-visible:ring-accent/70',
  },
  danger: {
    open: 'bg-bg-card ring-danger/40 shadow-lg shadow-danger/10',
    closed: 'bg-danger/[0.07] ring-danger/25 hover:bg-danger/10 hover:ring-danger/40',
    bar: 'bg-danger',
    plus: 'bg-danger text-bg-main',
    index: 'text-danger',
    focus: 'focus-visible:ring-danger/70',
  },
} as const

/**
 * One question that slides its answer open and shut: the library's disclosure.
 * The content stays in the page while closed (height 0 and inert, not
 * unmounted), so it is in the HTML a search engine reads. Instant with reduced
 * motion. A stack of them is a list of these in a column; each opens alone.
 * It keeps its own state, or follows `open` and `onOpenChange` when something
 * else can open it (a link to its `id`).
 */
export default function AccordionItem({
  title,
  index,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  tone = 'accent',
  id: rootId,
  children,
  className = '',
}: {
  /** The question: what is always shown. */
  title: ReactNode
  /** Its place in a list, shown as 01, 02…; none draws no number. */
  index?: number
  defaultOpen?: boolean
  /** Controlled: whether it is open (with `onOpenChange`). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  tone?: keyof typeof TONE
  /** The item's own id, for a link that scrolls to it. */
  id?: string
  /** The answer. */
  children: ReactNode
  /** Layout only. */
  className?: string
}) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen)
  const open = openProp ?? ownOpen
  const id = useId()
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.35
  const t = TONE[tone]
  const toggle = () => {
    setOwnOpen(!open)
    onOpenChange?.(!open)
  }

  return (
    <div
      id={rootId}
      className={`relative overflow-hidden rounded-card ring-1 transition-[background-color,box-shadow] duration-300 ${open ? t.open : t.closed} ${className}`}
    >
      <div aria-hidden="true" className={`absolute left-0 inset-y-0 w-1 ${t.bar} transition-transform duration-300 origin-top ${open ? 'scale-y-100' : 'scale-y-0'}`} />
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
          className={`w-full flex items-center gap-4 px-5 py-4 text-left rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${t.focus}`}
        >
          {index !== undefined && (
            <span aria-hidden="true" className={`text-xs font-mono tabular-nums transition-colors ${open ? t.index : 'text-text-secondary'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
          <span className="flex-1 font-semibold">{title}</span>
          <span
            aria-hidden="true"
            className={`shrink-0 grid place-items-center size-8 rounded-full transition-all duration-300 ${
              open ? `${t.plus} rotate-45` : 'bg-bg-main ring-1 ring-ink/10 text-text-secondary'
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
