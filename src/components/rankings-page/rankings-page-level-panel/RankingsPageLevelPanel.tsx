'use client'

import type { VaultMe } from '@/app/api/rankings/me/route'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import { CircularProgress } from '@/components/ui/CircularProgress'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import VaultFillProgress from '@/components/vault-fill-progress/VaultFillProgress'
import VaultPlatformSplit, { PLATFORM_FILL, PLATFORM_NAMES, PLATFORM_ORDER } from '@/components/vault-platform-split/VaultPlatformSplit'
import { levelProgress } from '@/utils/vaultLevel'

/**
 * Your own level beside the rankings: the ring to the next level, your tier
 * and the one after, this week, this month and your global place, and how
 * your points split across platforms. Says so while some games still count
 * provisionally, or before anything is scored.
 */
export default function RankingsPageLevelPanel({ me }: { me: VaultMe }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)
  const p = levelProgress(me.points)
  const total = Object.values(me.split).reduce((s, x) => s + (x ?? 0), 0)
  const fill = useVaultFillState()

  return (
    <section aria-labelledby="rankings-level-title" className="bg-bg-card rounded-3xl p-5 flex flex-col gap-4">
      <h2 id="rankings-level-title" className="text-xs uppercase tracking-wider font-bold text-text-secondary">
        {T.rankings.yourLevel}
      </h2>

      {fill?.active ? (
        // Being calculated: the ring counts games read, and each platform says how it is getting on.
        <>
          <div className="flex flex-col items-center gap-2">
            <CircularProgress
              earned={fill.read}
              total={Math.max(1, fill.total)}
              size={128}
              ariaLabel={T.rankings.fillA11y.replace('{pct}', String(fill.pct))}
              center={
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-xs text-text-secondary">{T.rankings.fillShort}</span>
                  <span className="text-2xl font-extrabold tabular-nums">{fill.pct} %</span>
                </span>
              }
            />
            <p className="text-sm text-center">
              <span className="text-warning font-bold" title={T.rankings.fillApprox}>≈</span> <strong className="tabular-nums">{n(me.points)}</strong>{' '}
              <span className="text-text-secondary">{T.rankings.vp}</span>
            </p>
          </div>
          <VaultFillProgress />
        </>
      ) : me.points === 0 ? (
        <p role="status" className="text-sm text-text-secondary">{T.rankings.noScore}</p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2">
            <CircularProgress
              earned={p.into}
              total={p.span}
              size={128}
              ariaLabel={T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))}
              center={
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-xs text-text-secondary">{T.rankings.colLevel}</span>
                  <span className="text-3xl font-extrabold tabular-nums">{p.level}</span>
                </span>
              }
            />
            <VaultLevelBadge points={me.points} />
            <p className="text-xs text-text-secondary text-center">
              {T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))}
              {' · '}
              {p.nextTier ? T.rankings.nextTier.replace('{tier}', T.rankings.tiers[p.nextTier.id]).replace('{level}', String(p.nextTier.from)) : T.rankings.lastTier}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              [T.rankings.colPoints, n(me.points)],
              [T.rankings.statWeek, `+${n(me.week)}`],
              [T.rankings.statMonth, `+${n(me.month)}`],
            ].map(([label, value]) => (
              <div key={label} className="bg-bg-main rounded-xl px-2 py-2 flex flex-col gap-0.5 min-w-0">
                <dt className="text-[10.5px] text-text-secondary truncate">{label}</dt>
                <dd className="text-sm font-bold tabular-nums truncate">{value}</dd>
              </div>
            ))}
          </dl>
          {me.rank > 0 && (
            <p className="text-sm flex justify-between gap-2">
              <span className="text-text-secondary">{T.rankings.statRank}</span>
              <strong className="tabular-nums">#{n(me.rank)}</strong>
            </p>
          )}

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-text-secondary">{T.rankings.sources}</h3>
            <VaultPlatformSplit split={me.split} />
            <ul className="flex flex-col gap-1">
              {PLATFORM_ORDER.filter((s) => (me.split[s] ?? 0) > 0).map((s) => (
                <li key={s} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className={`w-2 h-2 rounded-full ${PLATFORM_FILL[s]}`} />
                    {PLATFORM_NAMES[s]}
                  </span>
                  <span className="tabular-nums">
                    {n(me.split[s] ?? 0)} <span className="text-text-secondary">· {Math.round(((me.split[s] ?? 0) / total) * 100)} %</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* A platform that failed (a private profile, a refused key) says so after the fill too. */}
      {!fill?.active && <VaultFillProgress />}
      {!fill?.active && me.provisional > 0 && <p className="text-xs text-text-secondary">{T.rankings.provisional}</p>}
    </section>
  )
}
