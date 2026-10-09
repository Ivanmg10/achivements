'use client'

import { KeyboardEvent, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { BASE_GROUP, countTrophies } from '@/utils/psnTitles'
import type { PsnTrophyGroup } from '@/types/psn'

/** Which trophies the table shows: every group, or one. */
export type GroupTab = 'all' | string

/**
 * The tabs over a PSN game's trophy table when it has DLC: everything, the
 * base game, then each DLC by name, each with how far along it is. An ARIA
 * tablist: only the selected tab is in the tab order, the arrow keys move
 * between them, and the selected one is marked in bold and underline, not
 * only colour.
 */
export default function PsnTrophyGroupTabs({
  groups,
  selected,
  onSelect,
  panelId,
}: {
  groups: PsnTrophyGroup[]
  selected: GroupTab
  onSelect: (tab: GroupTab) => void
  /** The table the tabs control. */
  panelId: string
}) {
  const { T } = useLanguage()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const tabs = [
    { id: 'all', label: T.psn.allGroups, earned: null as number | null, total: null as number | null },
    ...groups.map((g) => ({
      id: g.id,
      label: g.id === BASE_GROUP ? T.psn.baseGame : g.name,
      earned: countTrophies(g.earned),
      total: countTrophies(g.defined),
    })),
  ]

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
    <div role="tablist" aria-label={T.psn.trophies} className="flex gap-4 overflow-x-auto w-full border-b border-bg-header [scrollbar-width:thin]">
      {tabs.map((tab, i) => {
        const active = tab.id === selected
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px shrink-0 flex items-center gap-1.5 pb-2 pt-1 text-sm border-b-2 transition-colors rounded-t focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1] ${
              active ? 'border-[#0070d1] text-text-main font-semibold' : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            <span className="max-w-56 truncate">{tab.label}</span>
            {tab.total !== null && (
              <span className={`text-xs tabular-nums ${tab.earned === tab.total ? 'text-green-400' : 'text-text-secondary'}`}>
                {tab.earned}/{tab.total}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
