'use client'

import { useMemo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import LibraryShelfCard from '@/components/library-shelf-card/LibraryShelfCard'
import { bentoCells, seededRandom, type Cell } from '@/utils/bentoLayout'
import type { LibraryEntry, QuickFilter } from '@/utils/libraryInsights'
import type { Shelf } from '@/utils/libraryShelves'

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

/*
 * The way in. The shelf's parent sets it going (see LibraryShelves); here the
 * title slides in and then the cards follow, one after another in the order
 * they sit in (the top row left to right, then the blocks under it), each
 * rising and growing into its place with a little spring.
 */
const SHELF: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
}
const TITLE: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}
const CARD: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 230, damping: 21 } },
}

/** One shelf: a titled bento grid of cards, with "see N" when there are more than it shows. */
export default function LibraryShelf({
  shelf,
  seed,
  onPick,
  onSeeShelf,
}: {
  shelf: Shelf
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
    <motion.section aria-label={text.title} variants={SHELF} className="flex flex-col gap-3">
      <motion.div variants={TITLE} className="flex items-baseline gap-x-3 gap-y-0.5 flex-wrap">
        <h2 className="text-base font-bold">{text.title}</h2>
        <p className="text-xs text-text-secondary">{text.hint}</p>
        {shelf.entries.length > shelf.cap && (
          <button
            type="button"
            onClick={() => onSeeShelf(shelf.quick)}
            className="ml-auto text-xs text-text-secondary hover:text-text-main underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {T.libraryLayout.seeShelf.replace('{n}', String(shelf.entries.length))}
          </button>
        )}
      </motion.div>
      <div className={GRID}>
        {shown.map((e, i) => (
          <motion.div key={e.key} variants={CARD} className={slot(cells[i], i)}>
            <LibraryShelfCard entry={e} size={cells[i].size} onPick={onPick} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
