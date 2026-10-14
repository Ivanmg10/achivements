'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconFilterOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFillViewport } from '@/hooks/useFillViewport'
import LibraryListRow from '@/components/library-list-row/LibraryListRow'
import LibraryEntryDetail from '@/components/library-entry-detail/LibraryEntryDetail'
import EmptyState from '@/components/empty-state/EmptyState'
import type { LibraryEntry } from '@/utils/libraryInsights'

/**
 * Every game in one scrolling list, and the selected game's detail beside it
 * (pinned while the page scrolls). Both are as tall as what is left of the
 * screen from where they start, so neither runs off the bottom of it. On a
 * narrow screen there is no room beside: the detail opens under its row
 * instead, and the row closes it again.
 */
export default function LibraryList({
  entries,
  selected,
  wide,
  category,
  onSelect,
}: {
  entries: LibraryEntry[]
  /** The game shown; none on a narrow screen once it has been closed. */
  selected?: LibraryEntry
  wide: boolean
  category: string
  onSelect: (entry: LibraryEntry | null) => void
}) {
  const { T } = useLanguage()
  const list = useRef<HTMLUListElement>(null)
  const block = useRef<HTMLDivElement>(null)
  // Measured from the block they share, not from either: the pinned one moves, the block's top is where both start.
  const height = useFillViewport(block, wide)
  const fill = height === undefined ? undefined : { height }
  const reduce = useReducedMotion()

  // The arrow keys can move the selection out of view: keep it in the list's.
  useEffect(() => {
    list.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected?.key])

  if (entries.length === 0) {
    return <EmptyState size="compact" icon={<IconFilterOff className="w-6 h-6" />} title={T.libraryFilters.noMatches} className="py-10" />
  }

  return (
    <div ref={block} className="grid grid-cols-1 lg:grid-cols-[minmax(340px,5fr)_minmax(0,7fr)] gap-4 items-start">
      <ul
        ref={list}
        style={fill}
        // Until it is measured, a guess that fits most screens.
        className={`flex flex-col gap-1.5 p-1 -m-1 lg:overflow-y-auto lg:overscroll-contain ${height === undefined ? 'lg:max-h-[calc(100dvh-16rem)] lg:min-h-88' : ''}`}
      >
        {entries.map((e, i) => {
          const current = e.key === selected?.key
          return (
            // The rows come in one after another, the first dozen; the rest are below the fold anyway.
            <motion.li
              key={e.key}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1], delay: Math.min(i, 12) * 0.03 }}
            >
              <LibraryListRow entry={e} current={current} onSelect={(x) => onSelect(!wide && current ? null : x)} />
              {!wide && current && (
                <div className="mt-2">
                  <LibraryEntryDetail key={e.key} entry={e} category={category} />
                </div>
              )}
            </motion.li>
          )
        })}
      </ul>
      {wide && selected && (
        <motion.aside
          initial={reduce ? false : { opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
          style={fill}
          className={`sticky top-4 lg:flex lg:flex-col lg:overflow-y-auto lg:overscroll-contain ${height === undefined ? 'lg:h-[calc(100dvh-2rem)]' : ''}`}
        >
          <LibraryEntryDetail key={selected.key} entry={selected} category={category} />
        </motion.aside>
      )}
    </div>
  )
}
