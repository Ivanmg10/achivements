'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import LibraryShelf from '@/components/library-shelf/LibraryShelf'
import { buildShelves } from '@/utils/libraryShelves'
import type { LibraryEntry, QuickFilter } from '@/utils/libraryInsights'
import Button from '@/components/ui/Button'

/**
 * A status list opened on its shelves: what to pick up next, grouped by what
 * each game needs. "See all" is always on screen: it sticks to the bottom edge
 * while the shelves are in view, and rests under the last one at the end, so
 * there is only ever one. They come in one after another (`.enter-shelves`).
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
  const shelves = useMemo(() => buildShelves(entries, category), [entries, category])

  return (
    <div className="flex flex-col gap-8 enter-shelves">
      {shelves.map((s, i) => (
        <LibraryShelf key={s.id} shelf={s} seed={seed + i * 7919} onPick={onPick} onSeeShelf={onSeeShelf} />
      ))}
      <div className="sticky bottom-5 z-30 flex justify-center pointer-events-none enter-rise">
        <Button
          type="button"
          onClick={onSeeAll}
          className="pointer-events-auto shadow-xl shadow-black/40"
        >
          {T.libraryLayout.seeAll.replace('{n}', String(entries.length))}
        </Button>
      </div>
    </div>
  )
}
