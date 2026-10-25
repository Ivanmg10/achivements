'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import LibraryShelf from '@/components/library-shelf/LibraryShelf'
import { buildShelves } from '@/utils/libraryShelves'
import type { LibraryEntry, QuickFilter } from '@/utils/libraryInsights'
import Button from '@/components/ui/Button'

/*
 * The entrance. The shelves come in one after another, each starting a beat
 * after the last one began (so the next shelf is already arriving while the
 * cards of the one above settle), and "see all" closes the sequence. What
 * each shelf does inside is in LibraryShelf; these variants only pass the
 * "hidden" and "show" down to it. With reduced motion everything is simply there.
 */
const ROOT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.04 } },
}
const END: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 24 } },
}

/**
 * A status list opened on its shelves: what to pick up next, grouped by what
 * each game needs. "See all" is always on screen: it sticks to the bottom edge
 * while the shelves are in view, and rests under the last one at the end, so
 * there is only ever one.
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
    <motion.div variants={ROOT} initial={reduce ? false : 'hidden'} animate="show" className="flex flex-col gap-8">
      {shelves.map((s, i) => (
        <LibraryShelf key={s.id} shelf={s} seed={seed + i * 7919} onPick={onPick} onSeeShelf={onSeeShelf} />
      ))}
      <motion.div variants={END} className="sticky bottom-5 z-30 flex justify-center pointer-events-none">
        <Button
          type="button"
          onClick={onSeeAll}
          className="pointer-events-auto shadow-xl shadow-black/40"
        >
          {T.libraryLayout.seeAll.replace('{n}', String(entries.length))}
        </Button>
      </motion.div>
    </motion.div>
  )
}
