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
 * The RA / Steam switch at the top of the main page profile column. Same pill
 * look as MainViewToggle; behaves as an ARIA tablist: only the selected tab is
 * in the tab order, and the arrow keys (plus Home/End) move between tabs.
 */
export default function MainPageProfileTabs<T extends string>({
  tabs,
  selected,
  onSelect,
  idPrefix,
}: {
  tabs: ProfileTab<T>[]
  selected: T
  onSelect: (id: T) => void
  idPrefix: string
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
      aria-label={T.steam.profileTabsLabel}
      className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/5 w-full"
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
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              active ? 'bg-accent text-bg-main' : 'text-text-secondary hover:text-text-main hover:bg-white/8'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
