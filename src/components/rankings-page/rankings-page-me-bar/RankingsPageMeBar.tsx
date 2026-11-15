'use client'

import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useVaultFillState } from '@/context/VaultFillContext'
import { levelProgress } from '@/utils/vaultLevel'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'

/**
 * Where you stand, kept at the bottom of the screen while the list scrolls:
 * your place, what it takes to pass the one above (or to level up, at the
 * top), and a bar to the next level. Not listed, it says why instead.
 */
export default function RankingsPageMeBar({
  me,
  above,
  showInRankings,
}: {
  me: RankRow & { listed: boolean }
  /** Who stands just above you in this view, if anyone. */
  above: RankRow | null
  showInRankings: boolean
}) {
  const { T, lang } = useLanguage()
  const progress = levelProgress(me.totalPoints)
  const n = (x: number) => x.toLocaleString(lang)
  const fill = useVaultFillState()
  const hint = fill?.active
    ? `${T.rankings.fillCalculating} ${T.rankings.fillGames.replace('{n}', n(fill.read)).replace('{total}', n(fill.total))}`
    : !me.listed
    ? showInRankings
      ? T.rankings.privateNote
      : T.rankings.optedOutNote
    : above && above.points >= me.points
      ? T.rankings.toRank.replace('{n}', n(above.points - me.points + 1)).replace('{rank}', String(above.rank))
      : T.rankings.toLevel.replace('{n}', n(progress.span - progress.into)).replace('{level}', String(progress.level + 1))

  return (
    <section
      aria-label={T.rankings.yourPlace}
      className="flex items-center gap-3 rounded-card bg-bg-header/95 backdrop-blur px-3 sm:px-4 py-2.5 ring-1 ring-accent/40 shadow-xl shadow-black/30"
    >
      <span className="text-lg sm:text-xl font-extrabold text-accent tabular-nums shrink-0">{me.rank > 0 ? `#${n(me.rank)}` : '—'}</span>
      <span className="min-w-0 flex-1">
        <RankingsPageUser row={me} linked={false}>
          <span className="text-xs text-text-secondary">{hint}</span>
        </RankingsPageUser>
      </span>
      <span className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-bold tabular-nums">
          {fill?.active && (
            <span className="text-warning" title={T.rankings.fillApprox}>
              ≈{' '}
            </span>
          )}
          {n(me.points)} <span className="text-[11px] font-semibold text-text-secondary">{T.rankings.vp}</span>
        </span>
        {fill?.active ? (
          <ProgressBar pct={fill.pct} label={T.rankings.fillA11y.replace('{pct}', String(fill.pct))} className="w-20 sm:w-28" />
        ) : (
          <ProgressBar pct={progress.pct} label={T.rankings.toLevel.replace('{n}', n(progress.span - progress.into)).replace('{level}', String(progress.level + 1))} className="w-20 sm:w-28" />
        )}
      </span>
    </section>
  )
}
