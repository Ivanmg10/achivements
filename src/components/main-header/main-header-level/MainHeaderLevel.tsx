'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'

const RING = 2 * Math.PI * 9

/**
 * Your level beside the streak, the way to the rankings. While your points are
 * being calculated, the same spot fills a ring with the percentage instead.
 * Nothing until there is either.
 */
export default function MainHeaderLevel({ glass }: { glass?: boolean }) {
  const { T } = useLanguage()
  const { me } = useVaultMe()
  const fill = useVaultFillState()
  const calculating = fill?.active === true
  if (!calculating && (!me || me.points <= 0)) return null

  return (
    <Link
      href="/rankings"
      className={`hidden sm:flex items-center shrink-0 rounded-tag transition-[filter] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${calculating ? (glass ? 'bg-ink/10' : 'bg-ink/[0.06]') : ''}`}
    >
      <span className="sr-only">{T.rankings.title}</span>
      {calculating ? (
        <span className="flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 text-[11px] font-semibold tabular-nums">
          <svg viewBox="0 0 24 24" className="w-5 h-5 -rotate-90" aria-hidden="true">
            <circle cx="12" cy="12" r="9" className="fill-none stroke-ink/15" strokeWidth="3.2" />
            {fill.pct > 0 ? (
              <circle cx="12" cy="12" r="9" className="fill-none stroke-progress transition-[stroke-dashoffset] duration-500" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - fill.pct / 100)} />
            ) : (
              <circle cx="12" cy="12" r="9" className="fill-none stroke-progress origin-center animate-spin motion-reduce:animate-none" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${RING / 4} ${RING}`} />
            )}
          </svg>
          <span aria-hidden="true">{fill.pct > 0 ? `${fill.pct} %` : T.rankings.fillShort}</span>
          <span className="sr-only">{T.rankings.fillA11y.replace('{pct}', String(fill.pct))}</span>
        </span>
      ) : (
        me && <VaultLevelBadge points={me.points} compact />
      )}
    </Link>
  )
}
