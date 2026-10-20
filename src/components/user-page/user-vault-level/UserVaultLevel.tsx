'use client'

import Link from 'next/link'
import { IconChevronRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import { ProgressBar } from '@/components/ui/ProgressBar'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import { levelProgress } from '@/utils/vaultLevel'

/** Your level on your account page: points, place, the bar to the next level, and the way to the rankings. */
export default function UserVaultLevel() {
  const { T, lang } = useLanguage()
  const { me, isLoading } = useVaultMe()
  if (isLoading || !me) return null

  const n = (x: number) => x.toLocaleString(lang)
  const p = levelProgress(me.points)
  const toNext = T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))

  return (
    <Link
      href="/rankings"
      className="group flex flex-col gap-2 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] px-3 py-2.5 hover:bg-ink/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <span className="flex items-center justify-between gap-2 min-w-0">
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-text-secondary">{T.rankings.yourLevel}</span>
          <VaultLevelBadge points={me.points} />
        </span>
        <span className="flex items-center gap-1 text-sm font-bold tabular-nums shrink-0">
          {n(me.points)} <span className="text-[11px] font-semibold text-text-secondary">{T.rankings.vp}</span>
          {me.rank > 0 && <span className="text-xs font-semibold text-text-secondary">· #{n(me.rank)}</span>}
          <IconChevronRight size={16} className="text-text-secondary group-hover:text-text-main transition-colors" aria-hidden="true" />
        </span>
      </span>
      {me.points > 0 ? (
        <>
          <ProgressBar pct={p.pct} label={toNext} />
          <span className="text-[11px] text-text-secondary">{toNext}</span>
        </>
      ) : (
        <span className="text-[11px] text-text-secondary">{T.rankings.noScore}</span>
      )}
    </Link>
  )
}
