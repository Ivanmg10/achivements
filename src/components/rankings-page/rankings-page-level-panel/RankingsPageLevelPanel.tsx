'use client'

import type { VaultMe } from '@/app/api/rankings/me/route'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { CountUp } from '@/components/ui/CountUp'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import VaultFillProgress from '@/components/vault-fill-progress/VaultFillProgress'
import VaultWeeksChart from '@/components/vault-weeks-chart/VaultWeeksChart'
import VaultPlatformSplit, { PLATFORM_FILL, PLATFORM_NAMES, PLATFORM_ORDER } from '@/components/vault-platform-split/VaultPlatformSplit'
import { levelProgress } from '@/utils/vaultLevel'

/** A card of the rankings' side column. */
export const CARD = 'bg-bg-card rounded-[1.25rem] ring-1 ring-inset ring-ink/[0.06] p-5 flex flex-col gap-3'

/**
 * Your own level beside the rankings: the ring to the next level, your tier,
 * your global place and the next tier, this week and this month, and, in a
 * card of its own, how your points split across platforms. Says so while some
 * games still count provisionally, or before anything is scored.
 */
export default function RankingsPageLevelPanel({ me }: { me: VaultMe }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)
  const p = levelProgress(me.points)
  const total = Object.values(me.split).reduce((s, x) => s + (x ?? 0), 0)
  const fill = useVaultFillState()

  return (
    <>
      <section aria-labelledby="rankings-level-title" className={`${CARD} items-center text-center`}>
        <h2 id="rankings-level-title" className="self-start text-[0.8125rem] font-bold text-text-secondary">
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
                size={150}
                animateIn
                ariaLabel={T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))}
                center={
                  <span className="flex flex-col items-center">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-text-secondary">{T.rankings.colLevel}</span>
                    <CountUp value={p.level} locale={lang} delay={0.25} className="font-display italic font-extrabold text-[3.875rem] leading-[0.85]" />
                  </span>
                }
              />
              <span className="flex flex-wrap justify-center items-center gap-1.5">
                <VaultLevelBadge points={me.points} />
                {me.rank > 0 && (
                  <span className="inline-flex items-center h-[1.375rem] px-2 rounded-[0.375rem] text-xs font-bold bg-ink/[0.06]">
                    {T.rankings.statRank} #{n(me.rank)}
                  </span>
                )}
              </span>
              <p className="text-[0.8125rem] text-text-secondary text-center">
                {T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))}
                {' · '}
                {p.nextTier ? T.rankings.nextTier.replace('{tier}', T.rankings.tiers[p.nextTier.id]).replace('{level}', String(p.nextTier.from)) : T.rankings.lastTier}
              </p>
            </div>

            <dl className="self-stretch grid grid-cols-3 gap-1.5 text-left">
              {[
                [T.rankings.colPoints, n(me.points), false],
                [T.rankings.statWeek, `+${n(me.week)}`, me.week > 0],
                [T.rankings.statMonth, `+${n(me.month)}`, me.month > 0],
              ].map(([label, value, up]) => (
                <div key={String(label)} className="bg-bg-main rounded-[0.625rem] p-2 flex flex-col min-w-0">
                  <dt className="text-[0.6875rem] text-text-secondary truncate">{label}</dt>
                  <dd className={`font-extrabold tabular-nums truncate ${up ? 'text-success' : ''}`}>{value}</dd>
                </div>
              ))}
            </dl>
            {me.weeks?.length > 0 && <VaultWeeksChart weeks={me.weeks} className="self-stretch" />}
          </>
        )}

        {/* A platform that failed (a private profile, a refused key) says so after the fill too. */}
        {!fill?.active && <VaultFillProgress />}
        {!fill?.active && me.provisional > 0 && <p className="text-xs text-text-secondary">{T.rankings.provisional}</p>}
      </section>

      {!fill?.active && total > 0 && (
        <section aria-labelledby="rankings-sources-title" className={`${CARD} gap-2`}>
          <h2 id="rankings-sources-title" className="font-bold">{T.rankings.sources}</h2>
          <VaultPlatformSplit split={me.split} className="h-2.5" />
          <dl className="grid grid-cols-[1fr_auto_auto] gap-x-2.5 gap-y-1 text-sm">
            {PLATFORM_ORDER.filter((s) => (me.split[s] ?? 0) > 0).map((s) => (
              <div key={s} className="contents">
                <dt className="flex items-center gap-2">
                  <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[3px] ${PLATFORM_FILL[s]}`} />
                  {PLATFORM_NAMES[s]}
                </dt>
                <dd className="font-bold tabular-nums text-right">{n(me.split[s] ?? 0)}</dd>
                <dd className="text-[0.8125rem] text-text-secondary tabular-nums text-right">{Math.round(((me.split[s] ?? 0) / total) * 100)} %</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  )
}
