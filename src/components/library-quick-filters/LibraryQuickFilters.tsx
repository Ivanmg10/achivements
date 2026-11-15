'use client'

import { useLanguage } from '@/context/LanguageContext'
import { ALMOST_PCT, STALLED_DAYS, type QuickFilter } from '@/utils/libraryInsights'
import Pill from '@/components/ui/Pill'

const DEFAULT_FILTERS: readonly QuickFilter[] = ['all', 'almost', 'stalled']

/**
 * A page's quick filters, each with how many games it holds: "almost done" and "stalled" for the games
 * in progress, the statuses themselves on "all games". A chip with nothing behind it is disabled,
 * unless it is the one in use, so it can always be left.
 */
export default function LibraryQuickFilters({
  value,
  counts,
  onChange,
  filters = DEFAULT_FILTERS,
}: {
  value: QuickFilter
  counts: Partial<Record<QuickFilter, number>>
  onChange: (quick: QuickFilter) => void
  /** Which, in order (`quickFiltersFor`). */
  filters?: readonly QuickFilter[]
}) {
  const { T } = useLanguage()
  const L = T.libraryFilters
  const label: Record<QuickFilter, string> = {
    all: L.all,
    almost: L.almost,
    stalled: L.stalled,
    playing: T.mainPage.playing,
    completed: T.mainPage.completed,
    wantToPlay: T.mainPage.wantToPlay,
  }
  const hint: Partial<Record<QuickFilter, string>> = {
    almost: `${L.almostHint} (≥ ${ALMOST_PCT}%)`,
    stalled: `${L.stalledHint} (> ${STALLED_DAYS})`,
  }

  return (
    <div role="group" aria-label={L.quickLabel} className="flex flex-wrap items-center gap-1.5">
      {filters.map((q) => {
        const active = value === q
        const n = counts[q] ?? 0
        return (
          <Pill key={q} pressed={active} count={n} disabled={!active && n === 0} title={hint[q]} onClick={() => onChange(q)}>
            {label[q]}
          </Pill>
        )
      })}
    </div>
  )
}
