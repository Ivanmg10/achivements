'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import LibraryShelf from '@/components/library-shelf/LibraryShelf'
import { buildShelves } from '@/utils/libraryShelves'
import type { LibraryEntry, QuickFilter } from '@/utils/libraryInsights'

/**
 * A status list opened on its shelves: what to pick up next, grouped by what
 * each game needs. The shelves come in one after another. "See all" is always
 * on screen: it sticks to the bottom edge while the shelves are in view, and
 * rests under the last one at the end, so there is only ever one.
 */
export default function LibraryShelves({
  entries,
  category,
  seed,
  onPick,
  onSeeShelf,
  onSeeAll,
}: {
  entries: LibraryEntry[]
  category: string
  /** What the bento arrangement is drawn from; a new one on each visit. */
  seed: number
  onPick: (entry: LibraryEntry) => void
  onSeeShelf: (quick: QuickFilter) => void
  onSeeAll: () => void
}) {
  const { T } = useLanguage()
  const reduce = useReducedMotion()
  const shelves = useMemo(() => buildShelves(entries, category), [entries, category])

  return (
    <div className="flex flex-col gap-8">
      {shelves.map((s, i) => (
        <motion.div
          key={s.id}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 28, delay: i * 0.08 }}
        >
          <LibraryShelf shelf={s} seed={seed + i * 7919} onPick={onPick} onSeeShelf={onSeeShelf} />
        </motion.div>
      ))}
      <div className="sticky bottom-5 z-30 flex justify-center pointer-events-none">
        <button
          type="button"
          onClick={onSeeAll}
          className="pointer-events-auto rounded-full bg-accent text-bg-main font-semibold text-sm px-6 py-2.5 shadow-xl shadow-black/40 hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
        >
          {T.libraryLayout.seeAll.replace('{n}', String(entries.length))}
        </button>
      </div>
    </div>
  )
}
