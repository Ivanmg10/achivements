'use client'

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLibraryKeys } from '@/hooks/useLibraryKeys'
import { useBackIntercept } from '@/hooks/useBackIntercept'
import LibraryShelves from '@/components/library-shelves/LibraryShelves'
import LibraryList from '@/components/library-list/LibraryList'
import LibraryQuickFilters from '@/components/library-quick-filters/LibraryQuickFilters'
import StatusSortControl, { type StatusSortState } from '@/components/status-sort-control/StatusSortControl'
import type { LibraryLayout } from '@/components/library-layout-toggle/LibraryLayoutToggle'
import type { PlatformChoice } from '@/components/library-platform-tabs/LibraryPlatformTabs'
import { countQuick, mixedSortKeys, sortEntries, type LibraryEntry, type QuickFilter } from '@/utils/libraryInsights'
import { filterEntries } from '@/utils/libraryShelves'

export const SEARCH_ID = 'category-search'

/**
 * A status list as shelves that turn into a list with the game's detail beside
 * it. The page owns what has to survive a change of layout (the search, the
 * quick filter, the order, the game picked, the platform); this owns the way
 * between the two views: a card picked on the shelves opens the list on
 * that game, and "back" (or Escape) returns to the shelves where they were.
 */
export default function LibraryExplorer({
  category,
  entries,
  platform,
  layout,
  onLayout,
  query,
  onQuery,
  quick,
  onQuick,
  sort,
  onSort,
  selectedKey,
  onSelectKey,
  search,
  layoutToggle,
}: {
  category: string
  /** The games of the list, of the platform chosen. */
  entries: LibraryEntry[]
  /** Which platform that is: when it changes, the whole view gives way to the new one. */
  platform: PlatformChoice
  layout: Exclude<LibraryLayout, 'cards'>
  onLayout: (layout: LibraryLayout) => void
  query: string
  onQuery: (query: string) => void
  quick: QuickFilter
  onQuick: (quick: QuickFilter) => void
  sort: StatusSortState
  onSort: (sort: StatusSortState) => void
  selectedKey: string | null
  onSelectKey: (key: string | null) => void
  /** The page's search box, first in the row of controls. */
  search?: ReactNode
  /** The choice of layout, last in it. */
  layoutToggle?: ReactNode
}) {
  const wide = useMediaQuery('(min-width: 1024px)')
  const reduce = useReducedMotion()
  const scrollBack = useRef(0)
  // The bento is arranged differently each time the list is entered, and holds still while it is open.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))

  const searched = useMemo(() => filterEntries(entries, { query, source: 'all', quick: 'all' }), [entries, query])
  const quickCounts = useMemo(() => countQuick(searched), [searched])
  const list = useMemo(() => sortEntries(filterEntries(entries, { query, source: 'all', quick }), sort), [entries, query, quick, sort])

  // On a wide screen something is always shown; on a narrow one a closed row stays closed.
  const selected = list.find((e) => e.key === selectedKey) ?? (wide ? list[0] : undefined)

  function pick(entry: LibraryEntry) {
    scrollBack.current = window.scrollY
    // A filter left over from an earlier visit could hide the very game picked.
    onQuick('all')
    onSelectKey(entry.key)
    onLayout('list')
  }
  function back() {
    onQuick('all')
    onLayout('shelves')
    requestAnimationFrame(() => window.scrollTo(0, scrollBack.current))
  }
  function seeShelf(next: QuickFilter) {
    onQuick(next)
    onLayout('list')
  }
  function move(step: -1 | 1) {
    const i = list.findIndex((e) => e.key === selected?.key)
    const next = list[Math.min(list.length - 1, Math.max(0, i + step))]
    if (next) onSelectKey(next.key)
  }

  // The list is a step on from the shelves: the back button of the top bar undoes it (and Escape does too).
  useBackIntercept(layout === 'list' ? back : null)

  useLibraryKeys({ layout, hasQuery: query !== '', onClearQuery: () => onQuery(''), onBack: back, onMove: move, searchId: SEARCH_ID })

  return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {search}
          {layout === 'list' && category === 'playing' && <LibraryQuickFilters value={quick} counts={quickCounts} onChange={onQuick} />}
          <span className="hidden sm:block grow" aria-hidden="true" />
          {layout === 'list' && <StatusSortControl cat={category} keys={mixedSortKeys(category)} sortState={sort} onChange={onSort} />}
          {layoutToggle}
        </div>

        {/*
          Changing the view or the platform swaps the whole thing: the old one leaves, the new one comes in.
          Not initial={false}: that would also switch off the entrance of everything inside (the shelves
          cascade) the first time the page loads, and leave it for the swaps only.
        */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${platform}:${layout}`}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {layout === 'shelves' ? (
              <LibraryShelves entries={entries} category={category} seed={seed} onPick={pick} onSeeShelf={seeShelf} onSeeAll={() => onLayout('cards')} />
            ) : (
              <LibraryList entries={list} selected={selected} wide={wide} category={category} onSelect={(e) => onSelectKey(e?.key ?? null)} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
  )
}
