'use client'

import Link from 'next/link'
import { IconChevronRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultMe } from '@/hooks/useVaultMe'
import { useVaultFillState } from '@/context/VaultFillContext'
import VaultFillProgress from '@/components/vault-fill-progress/VaultFillProgress'
import { ProgressBar } from '@/components/ui/ProgressBar'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import { levelProgress } from '@/utils/vaultLevel'

/** Your level on your account page: points, place, the bar to the next level, and the way to the rankings. */
export default function UserVaultLevel() {
  const { T, lang } = useLanguage()
  const { me, isLoading } = useVaultMe()
  const fill = useVaultFillState()
  if (isLoading || !me) return null

  const n = (x: number) => x.toLocaleString(lang)
  const p = levelProgress(me.points)
  const toNext = T.rankings.toLevel.replace('{n}', n(p.span - p.into)).replace('{level}', String(p.level + 1))

  return (
    <div className="flex flex-col gap-2 rounded-control bg-bg-main px-4 py-3">
      <Link
        href="/rankings"
        className="group flex flex-col gap-2 rounded-lg -m-1 p-1 hover:bg-ink/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <span className="flex items-center justify-between gap-2 min-w-0">
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-text-secondary">{T.rankings.yourLevel}</span>
            {fill?.active ? (
              <span className="text-[11px] font-bold text-warning bg-warning/15 h-5.5 inline-flex items-center px-2 rounded-chip tabular-nums">
                {T.rankings.fillShort} · {fill.pct} %
              </span>
            ) : (
              <VaultLevelBadge points={me.points} />
            )}
          </span>
          <span className="flex items-center gap-1 text-sm font-bold tabular-nums shrink-0">
            {fill?.active && (
              <span className="text-warning" title={T.rankings.fillApprox}>
                ≈
              </span>
            )}
            {n(me.points)} <span className="text-[11px] font-semibold text-text-secondary">{T.rankings.vp}</span>
            {me.rank > 0 && <span className="text-xs font-semibold text-text-secondary">· #{n(me.rank)}</span>}
            <IconChevronRight size={16} className="text-text-secondary group-hover:text-text-main transition-colors" aria-hidden="true" />
          </span>
        </span>
        {fill?.active ? null : me.points > 0 ? (
          <>
            <ProgressBar pct={p.pct} label={toNext} />
            <span className="text-[11px] text-text-secondary">{toNext}</span>
          </>
        ) : (
          <span className="text-[11px] text-text-secondary">{T.rankings.noScore}</span>
        )}
      </Link>
      {/* How each platform is getting on while it is calculated, and what to do if one failed. */}
      <VaultFillProgress wide />
    </div>
  )
}
