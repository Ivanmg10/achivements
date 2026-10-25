'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import { levelProgress } from '@/utils/vaultLevel'
import { SURFACE } from '@/components/ui/surface'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'

/** Your level beside the cover: the number in big, your tier, your points, what is left to the next and this week's gain. Opens the rankings. */
export default function MainPagePortadaSideLevel() {
  const { T, lang } = useLanguage()
  const { me } = useVaultMe()
  if (!me || me.points === 0) return null

  const n = (x: number) => x.toLocaleString(lang)
  const p = levelProgress(me.points)

  return (
    <Link
      href="/rankings"
      className={`${SURFACE} p-5 sm:px-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6 hover:ring-accent/40 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
    >
      <span className="flex flex-col items-center px-3">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-text-secondary">{T.rankings.colLevel}</span>
        <span className="font-display italic font-extrabold text-[2.75rem] leading-[0.9] tabular-nums pr-1">{p.level}</span>
      </span>
      <span className="flex flex-col gap-1 min-w-0">
        <VaultLevelBadge points={me.points} className="self-start" />
        <span className="tabular-nums">
          <strong className="text-[1.625rem] font-extrabold">{n(me.points)}</strong> <span className="text-text-secondary">{T.rankings.vp}</span>
        </span>
        <span className="text-[0.8125rem] text-text-secondary">
          {T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))}
          {me.rank > 0 && ` · #${n(me.rank)} ${T.rankings.global}`}
        </span>
        {me.week > 0 && <span className="text-[0.8125rem] font-bold text-success">{T.homeLayout.weekGain.replace('{n}', n(me.week))}</span>}
      </span>
    </Link>
  )
}
