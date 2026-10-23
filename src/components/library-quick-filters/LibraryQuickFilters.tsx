'use client'

import { useLanguage } from '@/context/LanguageContext'
import { ALMOST_PCT, QUICK_FILTERS, STALLED_DAYS, type QuickFilter } from '@/utils/libraryInsights'
import Pill from '@/components/ui/Pill'

/**
 * "Almost done" and "stalled" shortcuts for a list of games in progress, each
 * with how many it holds. A chip with nothing behind it is disabled, unless it
 * is the one in use, so it can always be left.
 */
export default function LibraryQuickFilters({
  value,
  counts,
  onChange,
}: {
  value: QuickFilter
  counts: Record<QuickFilter, number>
  onChange: (quick: QuickFilter) => void
}) {
  const { T } = useLanguage()
  const L = T.libraryFilters
  const hint: Record<QuickFilter, string | undefined> = {
    all: undefined,
    almost: `${L.almostHint} (≥ ${ALMOST_PCT}%)`,
    stalled: `${L.stalledHint} (> ${STALLED_DAYS})`,
  }

  return (
    <div role="group" aria-label={L.quickLabel} className="flex flex-wrap items-center gap-1.5">
      {QUICK_FILTERS.map((q) => {
        const active = value === q
        return (
          <Pill
            key={q}
            pressed={active}
            count={counts[q]}
            disabled={!active && counts[q] === 0}
            title={hint[q]}
            onClick={() => onChange(q)}
          >
            {L[q]}
          </Pill>
        )
      })}
    </div>
  )
}
