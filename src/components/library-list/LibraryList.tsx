'use client'

import { useEffect, useRef } from 'react'
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

  // The arrow keys can move the selection out of view: keep it in the list's.
  useEffect(() => {
    list.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected?.key])

  if (entries.length === 0) {
    return <EmptyState size="compact" icon={<IconFilterOff className="w-6 h-6" />} title={T.libraryFilters.noMatches} className="py-10" />
  }

  return (
    <div ref={block} className="grid grid-cols-1 lg:grid-cols-[minmax(22rem,35rem)_minmax(0,1fr)] gap-5 items-start">
      <ul
        ref={list}
        style={fill}
        // Until it is measured, a guess that fits most screens.
        className={`enter-rows flex flex-col gap-0.5 p-1 -m-1 lg:overflow-y-auto lg:overscroll-contain lg:[mask-image:linear-gradient(to_bottom,black_calc(100%-2rem),transparent)] ${height === undefined ? 'lg:max-h-[calc(100dvh-16rem)] lg:min-h-88' : ''}`}
      >
        {entries.map((e) => {
          const current = e.key === selected?.key
          return (
            <li key={e.key}>
              <LibraryListRow entry={e} current={current} category={category} onSelect={(x) => onSelect(!wide && current ? null : x)} />
              {!wide && current && (
                <div className="mt-2">
                  <LibraryEntryDetail key={e.key} entry={e} category={category} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {wide && selected && (
        <aside
          style={fill}
          className={`enter-card [--i:3] sticky top-4 lg:flex lg:flex-col lg:overflow-y-auto lg:overscroll-contain ${height === undefined ? 'lg:h-[calc(100dvh-2rem)]' : ''}`}
        >
          <LibraryEntryDetail key={selected.key} entry={selected} category={category} />
        </aside>
      )}
    </div>
  )
}
