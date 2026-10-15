'use client'

import { KeyboardEvent, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { BASE_GROUP, countTrophies, dlcShortName } from '@/utils/psnTitles'
import type { PsnTrophyGroup } from '@/types/psn'

/** Which trophies the table shows: every group, or one. */
export type GroupTab = 'all' | string

/**
 * The chips over a PSN game's trophy table when it has DLC: everything, the
 * base game, then each DLC — by its name without the game's title in front (Sony repeats it; the full name is the tooltip) —
 * each with how far along it is, green once complete. An ARIA tablist: only
 * the selected chip is in the tab order, the arrow keys move between them,
 * and the selected one is marked by its fill and bold text, not only colour.
 */
export default function PsnTrophyGroupTabs({
  groups,
  selected,
  onSelect,
  panelId,
  gameTitle = '',
}: {
  groups: PsnTrophyGroup[]
  selected: GroupTab
  onSelect: (tab: GroupTab) => void
  /** The table the tabs control. */
  panelId: string
  /** Cut from the front of each DLC's name. */
  gameTitle?: string
}) {
  const { T } = useLanguage()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const groupTabs = groups.map((g) => ({
    id: g.id,
    label: g.id === BASE_GROUP ? T.psn.baseGame : dlcShortName(g.name, gameTitle),
    fullName: g.id === BASE_GROUP ? T.psn.baseGame : g.name,
    earned: countTrophies(g.earned),
    total: countTrophies(g.defined),
  }))
  const tabs = [
    {
      id: 'all',
      label: T.psn.allGroups,
      fullName: T.psn.allGroups,
      earned: groupTabs.reduce((n, t) => n + t.earned, 0),
      total: groupTabs.reduce((n, t) => n + t.total, 0),
    },
    ...groupTabs,
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
    <div role="tablist" aria-label={T.psn.trophies} className="flex gap-2 overflow-x-auto w-full pb-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible">
      {tabs.map((tab, i) => {
        const active = tab.id === selected
        const complete = tab.total > 0 && tab.earned === tab.total
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
            title={tab.fullName !== tab.label ? tab.fullName : undefined}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`shrink-0 flex items-center gap-2 h-9 px-3.5 rounded-full text-sm ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              active
                ? 'bg-accent/15 ring-accent/60 text-text-main font-semibold'
                : 'bg-bg-main/40 ring-ink/10 text-text-secondary hover:text-text-main hover:bg-bg-main/70'
            }`}
          >
            <span className="max-w-48 truncate">{tab.label}</span>
            <span className={`text-xs tabular-nums ${complete ? 'text-success font-semibold' : active ? 'text-text-secondary' : 'opacity-80'}`}>
              {tab.earned}/{tab.total}
            </span>
          </button>
        )
      })}
    </div>
  )
}
