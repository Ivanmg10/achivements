'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { GameCardSkeleton } from '@/components/ui/GameCardSkeleton'
import { STATUS_GRID_COLS } from '@/components/status-grid-control/statusGridCols'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

const CARDS = 6

/**
 * A status list (want to play, playing, completed) while it loads, in the
 * page's own layout: the header with its controls, the console chips, and
 * cards shaped like the real ones (cover, title, chips, counts). It sits
 * where the list will be instead of covering the screen. Announced once.
 */
export default function StatusPageSkeleton({ cols = 2 }: { cols?: StatusGridCols }) {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-11 sm:h-14 w-56 max-w-full" />
        {/* The one toolbar of every view: the search on the left, the views on the right. */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Skeleton radius="field" className="h-10 w-full sm:w-80" />
          <Skeleton radius="tile" className="h-9 w-64" />
        </div>
        <div className="flex flex-wrap gap-1.5 py-1">
          {[20, 24, 16, 28, 20].map((w, i) => (
            <Skeleton key={i} radius="chip" className="h-7" style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>
        <div className={`grid gap-3 items-start w-full ${STATUS_GRID_COLS[cols]}`}>
          {Array.from({ length: CARDS }, (_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
