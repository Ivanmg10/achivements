'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import LibraryShelfCard from '@/components/library-shelf-card/LibraryShelfCard'
import Shelf from '@/components/ui/Shelf'
import { bentoCells, seededRandom, type Cell } from '@/utils/bentoLayout'
import type { LibraryEntry, QuickFilter } from '@/utils/libraryInsights'
import type { Shelf as ShelfData } from '@/utils/libraryShelves'

/*
 * A shelf is a small bento grid. Which cards are big and where is drawn from a
 * seed, so it changes from one visit to the next (see bentoCells): four small
 * cards across the top, then featured, wide and plain blocks that each fill
 * whole rows. The classes are whole strings so Tailwind can see them.
 *
 * On narrower screens the same blocks hold in fewer columns: a big card is two
 * columns wide, a featured one two rows tall from three columns up, and the
 * cards that come after fill what is left beside them.
 */
const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense gap-4'
/** A card that sits on the right of its row: the ones after it fill the left. */
const RIGHT = 'lg:col-start-2 xl:col-start-3'
const SLOT: Record<Cell['size'], string> = {
  compact: '',
  wide: 'sm:col-span-2',
  feature: 'sm:col-span-2 lg:row-span-2',
}
/** On a phone one column is long enough: past the first six, the rest is a click away. */
const PHONE_LIMIT = 6

const slot = (cell: Cell, index: number) =>
  [SLOT[cell.size], cell.right ? RIGHT : '', index >= PHONE_LIMIT ? 'max-sm:hidden' : ''].filter(Boolean).join(' ')

/** One shelf: a titled bento grid of cards, with "see N" when there are more than it shows. */
export default function LibraryShelf({
  shelf,
  seed,
  onPick,
  onSeeShelf,
}: {
  shelf: ShelfData
  /** What the arrangement is drawn from: the same seed, the same layout. */
  seed: number
  onPick: (entry: LibraryEntry) => void
  onSeeShelf: (quick: QuickFilter) => void
}) {
  const { T } = useLanguage()
  const text = T.libraryLayout.shelves[shelf.id]
  const shown = useMemo(() => shelf.entries.slice(0, shelf.cap), [shelf.entries, shelf.cap])
  const cells = useMemo(() => bentoCells(shown.length, seededRandom(seed)), [shown.length, seed])

  return (
    <Shelf
      title={text.title}
      hint={text.hint}
      action={shelf.entries.length > shelf.cap ? { label: T.libraryLayout.seeShelf.replace('{n}', String(shelf.entries.length)), onClick: () => onSeeShelf(shelf.quick) } : undefined}
    >
      <div className={`${GRID} enter-cards`}>
        {shown.map((e, i) => (
          <div key={e.key} className={slot(cells[i], i)}>
            <LibraryShelfCard entry={e} size={cells[i].size} completed={shelf.id === 'recent' || shelf.id === 'older'} onPick={onPick} />
          </div>
        ))}
      </div>
    </Shelf>
  )
}
