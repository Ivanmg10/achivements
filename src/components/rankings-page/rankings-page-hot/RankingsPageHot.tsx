'use client'

import { IconFlame } from '@tabler/icons-react'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'

/**
 * Beside your level: who earned most this week (everyone, every platform),
 * with this week's points, and a way to the weekly ranking when it is not the
 * one shown.
 */
export default function RankingsPageHot({ rows, linked, onSeeWeek }: { rows: RankRow[]; linked: boolean; onSeeWeek?: () => void }) {
  const { T, lang } = useLanguage()

  return (
    <section aria-labelledby="rankings-hot-title" className="bg-bg-card rounded-card p-5 flex flex-col gap-3">
      <h2 id="rankings-hot-title" className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-text-secondary">
        <IconFlame size={14} className="text-accent" aria-hidden="true" />
        {T.rankings.hotTitle}
      </h2>
      <ol className="flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <li key={r.username} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2.5 py-2 text-sm bg-bg-main">
            <span className="font-extrabold tabular-nums text-text-secondary">{i + 1}</span>
            <RankingsPageUser row={r} linked={linked} />
            <span className="font-bold tabular-nums text-success whitespace-nowrap">
              +{r.points.toLocaleString(lang)} <span className="text-[10px] font-semibold text-text-secondary">{T.rankings.vp}</span>
            </span>
          </li>
        ))}
      </ol>
      {onSeeWeek && (
        <button
          onClick={onSeeWeek}
          className="self-start text-xs font-semibold text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {T.rankings.hotSee}
        </button>
      )}
    </section>
  )
}
