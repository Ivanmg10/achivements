'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import type { GameSource } from '@/types/steam'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { fillMessage } from '@/utils/vaultFill'

/**
 * On a platform's card, right after linking it: its Vault Points being
 * calculated (with a bar), then how many games counted, or what is wrong. Says
 * nothing while there is no fill to report.
 */
export default function VaultFillLine({ source }: { source: GameSource }) {
  const { T, lang } = useLanguage()
  const p = useVaultFillState()?.status?.platforms?.[source]
  if (!p) return null
  const message = fillMessage(source, p, T.rankings)
  const n = (x: number) => x.toLocaleString(lang)

  if (p.state === 'error') {
    return (
      <p role="alert" className="text-xs rounded-box px-2.5 py-1.5 bg-danger/10 ring-1 ring-danger/30">
        {message}
      </p>
    )
  }
  if (p.state === 'done') {
    if (p.total === 0) return null
    return (
      <p className="text-xs">
        <span className="text-success">{T.rankings.fillCounted.replace('{n}', n(p.read))}</span>
        {(p.skipped ?? 0) > 0 && <span className="text-text-secondary"> · {T.rankings.fillSkipped.replace('{n}', n(p.skipped!))}</span>}
      </p>
    )
  }
  const games = T.rankings.fillGames.replace('{n}', n(p.read)).replace('{total}', n(p.total))
  return (
    <div role="status" className="flex flex-col gap-1.5">
      <p className="text-xs">
        {T.rankings.fillCalculating} {p.total > 0 && <strong className="tabular-nums">{games}</strong>}
      </p>
      <ProgressBar pct={p.total > 0 ? (p.read / p.total) * 100 : 0} label={`${T.rankings.fillCalculating} ${games}`} />
      {message && <p className="text-xs text-text-secondary">{message}</p>}
    </div>
  )
}
