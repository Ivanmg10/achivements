'use client'

import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { motion } from 'framer-motion'

export type StatsSection = {
  id: string
  label: string
  icon: ReactNode
}

const NEXT_KEYS = ['ArrowDown', 'ArrowRight']
const PREV_KEYS = ['ArrowUp', 'ArrowLeft']

/**
 * The section picker for Stats & Activity: a vertical rail of icons and
 * labels beside the cards on desktop, running the full height of the
 * sections with its list sticking under the floating bar as the page
 * scrolls; on mobile a horizontal strip that sticks under the bar. A tablist: arrow keys, Home and End move
 * between sections, and only the selected one is in the tab order.
 *
 * The selected section is marked by a raised pill, a bar and a bolder label,
 * so it never depends on colour alone.
 */
export default function MainPageStatsRail({
  sections,
  active,
  onChange,
  label,
  idPrefix,
}: {
  sections: StatsSection[]
  active: string
  onChange: (id: string) => void
  /** Accessible name for the tablist. */
  label: string
  /** Shared with the panels, which point back with aria-labelledby. */
  idPrefix: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: KeyboardEvent, index: number) {
    let next = -1
    if (NEXT_KEYS.includes(e.key)) next = (index + 1) % sections.length
    else if (PREV_KEYS.includes(e.key)) next = (index - 1 + sections.length) % sections.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = sections.length - 1
    if (next === -1) return
    e.preventDefault()
    onChange(sections[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-bg-main/85 backdrop-blur-xl lg:static lg:z-auto lg:mx-0 lg:p-2 lg:self-stretch lg:bg-bg-card lg:backdrop-blur-none lg:rounded-2xl">
    <div
      role="tablist"
      aria-label={label}
      aria-orientation="vertical"
      className="flex lg:flex-col gap-1 overflow-x-auto snap-x lg:overflow-visible lg:sticky lg:top-20 [scrollbar-width:none]"
    >
      {sections.map((section, i) => {
        const selected = section.id === active
        return (
          <button
            key={section.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            id={`${idPrefix}-tab-${section.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${section.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(section.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`relative snap-start shrink-0 flex items-center gap-2.5 px-3.5 py-2 lg:py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              selected ? 'text-text-main font-semibold' : 'text-text-secondary hover:text-text-main hover:bg-white/5'
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`${idPrefix}-pill`}
                aria-hidden="true"
                className="absolute inset-0 rounded-xl bg-bg-tertiary ring-1 ring-white/[0.06]"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              >
                <span className="absolute left-0 bottom-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 h-0.5 w-full lg:h-5 lg:w-1 rounded-full bg-accent" />
              </motion.span>
            )}
            <span aria-hidden="true" className={`relative ${selected ? 'text-accent' : ''}`}>
              {section.icon}
            </span>
            <span className="relative">{section.label}</span>
          </button>
        )
      })}
    </div>
    </div>
  )
}
