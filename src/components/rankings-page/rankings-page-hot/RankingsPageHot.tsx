'use client'

import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import { HOT_MAX } from '@/hooks/useRankings'
import { useFitCount } from '@/hooks/useFitCount'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'
import { CARD } from '../rankings-page-level-panel/RankingsPageLevelPanel'

const ROW = 'grid grid-cols-[1.125rem_minmax(0,1fr)_auto] items-center gap-2.5 py-1.5 -mx-2 px-2 rounded-box text-sm'
const RANK = 'font-display italic font-extrabold text-lg leading-none tabular-nums'

/**
 * Beside your level: who earned most this week (everyone, every platform),
 * with this week's points, and a way to the weekly ranking when it is not the
 * one shown. The card keeps the room of the whole list whatever the week has
 * (#168): a place nobody holds yet is a quiet row (its number and a muted line),
 * and with nobody at all a line says so. Beside the rankings (from lg) the card
 * fills what is left of the column down to the screen's foot, as many rows as fit
 * (one at least): its height is 0 plus what it grows into, so the column's own
 * least height (`min-h-min`) counts only its floor, not all ten rows.
 */
export default function RankingsPageHot({ rows, linked, onSeeWeek }: { rows: RankRow[]; linked: boolean; onSeeWeek?: () => void }) {
  const { T, lang } = useLanguage()
  const [listRef, fits] = useFitCount<HTMLOListElement>(HOT_MAX, 1)
  const slots = Math.min(HOT_MAX, fits)
  const shown = rows.slice(0, slots)

  return (
    <section aria-labelledby="rankings-hot-title" className={`${CARD} gap-1 lg:flex-1 lg:h-0 lg:min-h-[9.625rem]`}>
      <h2 id="rankings-hot-title" className="font-bold mb-1.5">
        {T.rankings.hotTitle}
      </h2>
      {rows.length === 0 && <p className="text-sm text-text-secondary">{T.rankings.hotEmpty}</p>}
      <ol ref={listRef} className="flex flex-col enter-rows lg:flex-1 lg:min-h-0 overflow-hidden">
        {shown.map((r, i) => (
          <li key={r.username} className={`relative ${ROW} transition-colors ${linked ? 'hover:bg-ink/[0.05]' : ''}`}>
            <span className={`${RANK} text-text-secondary`}>{i + 1}</span>
            <RankingsPageUser row={r} linked={linked} nameClass="font-bold" rowRadius="after:rounded-box" />
            <span className="font-extrabold tabular-nums text-success whitespace-nowrap">
              +{r.points.toLocaleString(lang)} <span className="text-[10px] font-semibold text-text-secondary">{T.rankings.vp}</span>
            </span>
          </li>
        ))}
        {Array.from({ length: slots - shown.length }, (_, k) => (
          <li key={`empty-${k}`} aria-hidden="true" className={ROW}>
            <span className={`${RANK} text-text-secondary/40`}>{shown.length + k + 1}</span>
            <span className="flex items-center gap-2.5 h-8">
              <span className="w-8 h-8 rounded-full bg-ink/[0.05]" />
              <span className="h-2 w-2/5 rounded-full bg-ink/[0.06]" />
            </span>
          </li>
        ))}
      </ol>
      {onSeeWeek && (
        <button
          onClick={onSeeWeek}
          className="self-start text-xs font-semibold text-accent hover:underline rounded focus-ring"
        >
          {T.rankings.hotSee}
        </button>
      )}
    </section>
  )
}
