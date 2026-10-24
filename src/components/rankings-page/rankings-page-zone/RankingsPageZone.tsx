'use client'

import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import RankingsPageTable from '../rankings-page-table/RankingsPageTable'
import RankingsPageList from '../rankings-page-list/RankingsPageList'
import { buttonClass } from '@/components/ui/Button'

/** How many more rows one press of "more above/below" shows (the hook's step). */
const STEP = 10

const BUTTON = buttonClass('secondary', 'sm')

/**
 * Your zone, below the top of the list when you are not in it: you, and who
 * stands just above and below you, each saying how far ahead or behind they
 * are. "More above" and "more below" widen it while there is more to show
 * before it meets the list above or reaches the end.
 */
export default function RankingsPageZone({
  me,
  rows,
  total,
  upLeft,
  downLeft,
  onWiden,
  widening,
  arrows,
  linked,
  approx,
  byPoints = true,
}: {
  me: RankRow
  rows: RankRow[]
  /** How many are listed, for "#rank of total". */
  total: number
  /** Rows between the top of the list shown and this zone, and after it: 0 hides the button. */
  upLeft: number
  downLeft: number
  onWiden: (side: 'up' | 'down') => void
  widening: boolean
  arrows: boolean
  linked: boolean
  approx: boolean
  /** Ordered by a streak, how far ahead in points says nothing about the order: left out. */
  byPoints?: boolean
}) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)
  const of = T.rankings.zoneOf
    .replace('{rank}', n(me.rank))
    .replace('{total}', n(total))
    .replace('{pct}', String(Math.max(1, Math.ceil((me.rank / Math.max(1, total)) * 100))))

  return (
    <section aria-labelledby="rankings-zone-title" className="bg-bg-card rounded-card ring-1 ring-accent/35 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-ink/[0.07]">
        <div className="flex flex-col gap-0.5">
          <h2 id="rankings-zone-title" className="text-sm font-bold">{T.rankings.zone}</h2>
          <p className="text-xs text-text-secondary tabular-nums">{of}</p>
        </div>
        {upLeft > 0 && (
          <button onClick={() => onWiden('up')} disabled={widening} className={BUTTON}>
            <IconChevronUp size={14} aria-hidden="true" />
            {T.rankings.zoneUp.replace('{n}', n(Math.min(STEP, upLeft)))}
          </button>
        )}
      </div>
      <div className="hidden md:block">
        <RankingsPageTable rows={rows} arrows={arrows} linked={linked} caption={`${T.rankings.zone} · ${of}`} approx={approx} gapFrom={byPoints ? me.points : undefined} />
      </div>
      <div className="md:hidden p-2">
        <RankingsPageList rows={rows} arrows={arrows} linked={linked} approx={approx} gapFrom={byPoints ? me.points : undefined} />
      </div>
      {downLeft > 0 && (
        <div className="flex justify-center px-4 py-3 border-t border-ink/[0.07]">
          <button onClick={() => onWiden('down')} disabled={widening} className={BUTTON}>
            <IconChevronDown size={14} aria-hidden="true" />
            {T.rankings.zoneDown.replace('{n}', n(Math.min(STEP, downLeft)))}
          </button>
        </div>
      )}
    </section>
  )
}
