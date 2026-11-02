'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { GameCardSkeleton } from '@/components/ui/GameCardSkeleton'

const CARDS = 6
const GRID: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

/**
 * A status list (want to play, playing, completed) while it loads, in the
 * page's own layout: the header with its controls, the console chips, and
 * cards shaped like the real ones (cover, title, chips, counts). It sits
 * where the list will be instead of covering the screen. Announced once.
 */
export default function StatusPageSkeleton({ cols = 2 }: { cols?: number }) {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Skeleton className="h-8 w-56 max-w-full" />
          <div className="flex gap-2">
            <Skeleton radius="tile" className="h-9 w-48" />
            <Skeleton radius="tile" className="h-9 w-28" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 py-1">
          {[20, 24, 16, 28, 20].map((w, i) => (
            <Skeleton key={i} radius="chip" className="h-7" style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>
        <div className={`grid gap-2 ${GRID[cols] ?? GRID[2]}`}>
          {Array.from({ length: CARDS }, (_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
