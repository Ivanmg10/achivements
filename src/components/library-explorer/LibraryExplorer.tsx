'use client'

import { useMemo, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLibraryKeys } from '@/hooks/useLibraryKeys'
import LibraryList from '@/components/library-list/LibraryList'
import LibraryQuickFilters from '@/components/library-quick-filters/LibraryQuickFilters'
import LibraryToolbar from '@/components/library-toolbar/LibraryToolbar'
import StatusSortControl, { type StatusSortState } from '@/components/status-sort-control/StatusSortControl'
import type { PlatformChoice } from '@/components/library-platform-tabs/LibraryPlatformTabs'
import { countQuick, mixedSortKeys, quickFiltersFor, sortEntries, type LibraryEntry, type QuickFilter } from '@/utils/libraryInsights'
import { filterEntries } from '@/utils/libraryEntries'

export const SEARCH_ID = 'category-search'

/**
 * A status list as a list with the game's detail beside it, and its row of
 * controls. The page owns what has to survive a change of layout (the search,
 * the quick filter, the order, the game picked, the platform); this filters,
 * sorts and moves through the list.
 */
export default function LibraryExplorer({
  category,
  entries,
  platform,
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
  /** Which platform that is: when it changes, the whole list gives way to the new one. */
  platform: PlatformChoice
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

  const searched = useMemo(() => filterEntries(entries, { query, source: 'all', quick: 'all' }), [entries, query])
  const quickFilters = quickFiltersFor(category)
  const quickCounts = useMemo(() => countQuick(searched), [searched])
  const list = useMemo(() => sortEntries(filterEntries(entries, { query, source: 'all', quick }), sort), [entries, query, quick, sort])

  // On a wide screen something is always shown; on a narrow one a closed row stays closed.
  const selected = list.find((e) => e.key === selectedKey) ?? (wide ? list[0] : undefined)

  function move(step: -1 | 1) {
    const i = list.findIndex((e) => e.key === selected?.key)
    const next = list[Math.min(list.length - 1, Math.max(0, i + step))]
    if (next) onSelectKey(next.key)
  }

  useLibraryKeys({ hasQuery: query !== '', onClearQuery: () => onQuery(''), onMove: move, searchId: SEARCH_ID })

  return (
      <div className="flex flex-col gap-4">
        <LibraryToolbar
          search={search}
          filters={quickFilters.length > 0 && <LibraryQuickFilters value={quick} counts={quickCounts} filters={quickFilters} onChange={onQuick} />}
          end={
            <>
              <StatusSortControl cat={category} keys={mixedSortKeys(category)} sortState={sort} onChange={onSort} />
              {layoutToggle}
            </>
          }
        />

        {/*
          Changing the platform swaps the whole list: the old one leaves, the new one comes in.
          initial={false}: on the first load the rows inside make the entrance, in CSS.
        */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={platform}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <LibraryList entries={list} selected={selected} wide={wide} category={category} onSelect={(e) => onSelectKey(e?.key ?? null)} />
          </motion.div>
        </AnimatePresence>
      </div>
  )
}
