'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import { levelProgress } from '@/utils/vaultLevel'
import { SURFACE } from '@/components/ui/surface'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { CountUp } from '@/components/ui/CountUp'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import { PortadaLevelSkeleton } from '../../main-page-portada-skeleton/MainPagePortadaSkeleton'

/** Your level beside the cover: the number in big, your tier, your points, what is left to the next and this week's gain. Opens the rankings. */
export default function MainPagePortadaSideLevel() {
  const { T, lang } = useLanguage()
  const { me, isLoading } = useVaultMe()
  if (isLoading) return <PortadaLevelSkeleton />
  if (!me || me.points === 0) return null

  const n = (x: number) => x.toLocaleString(lang)
  const p = levelProgress(me.points)

  const days = me.days ?? []
  const max = Math.max(1, ...days.map((d) => d.points))
  const delta = me.rankDelta
  const deltaText = delta === null || delta === undefined ? null : delta > 0
    ? T.rankings.up.replace('{n}', n(delta))
    : delta < 0 ? T.rankings.down.replace('{n}', n(-delta)) : T.rankings.same

  return (
    <Link
      href="/rankings"
      className={`${SURFACE} p-5 sm:px-6 flex flex-col gap-4 hover:ring-accent/40 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
    >
      <span className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5">
        <CircularProgress
          earned={p.into}
          total={p.span}
          size={112}
          strokeWidth={8}
          animateIn
          ariaLabel={T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))}
          center={
            <span className="flex flex-col items-center">
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-text-secondary">{T.rankings.colLevel}</span>
              <CountUp value={p.level} locale={lang} className="font-display italic font-extrabold text-[2.75rem] leading-[0.9]" />
            </span>
          }
        />
        <span className="flex flex-col gap-1 min-w-0">
          <VaultLevelBadge points={me.points} className="self-start" />
          <span className="tabular-nums">
            <CountUp value={me.points} locale={lang} className="text-[1.625rem] font-extrabold" /> <span className="text-text-secondary">{T.rankings.vp}</span>
          </span>
          <span className="text-[0.8125rem] text-text-secondary">
            {T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))}
            {me.rank > 0 && ` · #${n(me.rank)} ${T.rankings.global}`}
          </span>
        </span>
      </span>
      <span className="flex flex-col gap-2 border-t border-ink/10 pt-3">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold">{T.homeLayout.yourWeek}</span>
          {deltaText && <span className={`text-xs font-bold ${delta! > 0 ? 'text-success' : delta! < 0 ? 'text-danger' : 'text-text-secondary'}`}>{deltaText}</span>}
        </span>
        <span className="flex items-end gap-4">
          <span className="shrink-0 tabular-nums">
            <strong className="text-xl font-extrabold text-success">+{n(me.week)}</strong> <span className="text-xs text-text-secondary">{T.rankings.vp}</span>
          </span>
          {days.length > 0 && (
            <span
              role="img"
              aria-label={T.homeLayout.weekDaysA11y.replace('{list}', days.map((d) => n(d.points)).join(', '))}
              className="flex items-end gap-1 h-10 flex-1"
            >
              {days.map((d) => (
                <span
                  key={d.start}
                  aria-hidden="true"
                  style={{ height: `${Math.max(8, (d.points / max) * 100)}%` }}
                  className={`flex-1 ${d.points > 0 ? 'bg-accent' : 'bg-ink/10'}`}
                />
              ))}
            </span>
          )}
        </span>
      </span>
    </Link>
  )
}
