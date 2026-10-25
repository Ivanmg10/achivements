'use client'

import { KeyboardEvent, ReactNode, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export type ProfileTab<T extends string> = { id: T; label: string; icon?: ReactNode }

/** Ids tying each tab to its panel, for aria-controls / aria-labelledby. */
export function profileTabId(prefix: string, id: string) {
  return `${prefix}-tab-${id}`
}
export function profilePanelId(prefix: string, id: string) {
  return `${prefix}-panel-${id}`
}

/**
 * The RA / Steam switch at the top of the main page profile column. Kept
 * low-key — small text tabs with a thin underline on the active one (plus
 * bolder text, so it is not colour alone) — so it does not compete with the
 * profile below.
 *
 * Behaves as an ARIA tablist: only the selected tab is in the tab order, and
 * the arrow keys (plus Home/End) move between tabs.
 */
export default function MainPageProfileTabs<T extends string>({
  tabs,
  selected,
  onSelect,
  idPrefix,
  label,
  size = 'sm',
}: {
  tabs: ProfileTab<T>[]
  selected: T
  onSelect: (id: T) => void
  idPrefix: string
  /** What the tabs switch between; the profile's platforms by default. */
  label?: string
  /** 'md' for a page's own sections, where the tabs lead rather than recede. */
  size?: 'sm' | 'md'
}) {
  const { T } = useLanguage()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next === null) return
    e.preventDefault()
    onSelect(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label ?? T.steam.profileTabsLabel}
      className={`flex items-end w-full shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)] ${size === 'md' ? 'gap-5 px-1 overflow-x-auto overflow-y-hidden' : 'gap-0.5 overflow-x-auto overflow-y-hidden'}`}
    >
      {tabs.map((tab, i) => {
        const active = tab.id === selected
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[i] = el }}
            role="tab"
            id={profileTabId(idPrefix, tab.id)}
            aria-selected={active}
            aria-controls={profilePanelId(idPrefix, tab.id)}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative flex items-center shrink-0 gap-1.5 ${size === 'md' ? 'px-0.5 pb-2.5 pt-1 text-sm' : 'h-10 px-3 text-sm'} transition-colors duration-(--motion-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-t ${
              active ? 'text-text-main font-semibold' : `text-text-secondary hover:text-text-main ${size === 'md' ? 'font-medium' : 'font-semibold'}`
            }`}
          >
            {/* The profile's platform tabs are words only, as agreed; a page's own sections keep their icons. */}
            {size === 'md' && tab.icon}
            {tab.label}
            <span
              aria-hidden="true"
              className={`absolute bottom-0 ${size === 'md' ? 'left-0 right-0 h-1' : 'left-2 right-2 h-[3px]'} bg-accent skew-x-(--slant-line) origin-left transition-transform duration-(--motion-open) ease-out motion-reduce:transition-none ${active ? 'scale-x-100' : 'scale-x-0'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
