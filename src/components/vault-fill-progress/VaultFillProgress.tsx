'use client'

import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import type { GameSource } from '@/types/steam'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PLATFORM_FILL, PLATFORM_NAMES, PLATFORM_ORDER } from '@/components/vault-platform-split/VaultPlatformSplit'
import { fillMessage } from '@/utils/vaultFill'

/**
 * How the Vault Points fill is getting on, per platform: a bar and "read of
 * total" each, a tick when one is done, and what to do when one failed (a
 * private profile, a refused key) or why it waits. While the fill runs, and
 * whenever a platform needs the user; nothing otherwise.
 */
export default function VaultFillProgress({ className = '' }: { className?: string }) {
  const { T, lang } = useLanguage()
  const fill = useVaultFillState()
  const platforms = fill?.status?.platforms ?? {}
  const sources = PLATFORM_ORDER.filter((s) => platforms[s])
  const messages = sources.map((s) => [s, fillMessage(s, platforms[s]!, T.rankings)] as const).filter((m): m is readonly [GameSource, string] => m[1] !== null)
  if (!fill || (!fill.active && messages.every(([s]) => platforms[s]?.state !== 'error'))) return null

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {fill.active && (
        <ul className="flex flex-col gap-1.5">
          {sources.map((s) => {
            const p = platforms[s]!
            const done = p.state === 'done'
            const pct = p.total > 0 ? (p.read / p.total) * 100 : 0
            return (
              <li key={s} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={`w-2 h-2 rounded-full ${PLATFORM_FILL[s]}`} />
                  {PLATFORM_NAMES[s]}
                </span>
                <ProgressBar pct={p.state === 'error' ? 0 : done ? 100 : pct} label={`${PLATFORM_NAMES[s]}: ${T.rankings.fillGames.replace('{n}', p.read.toLocaleString(lang)).replace('{total}', p.total.toLocaleString(lang))}`} />
                <span className={`tabular-nums text-right ${done ? 'text-success font-semibold' : 'text-text-secondary'}`}>
                  {done ? (
                    <span className="inline-flex items-center gap-0.5">
                      <IconCheck size={12} aria-hidden="true" />
                      {p.total.toLocaleString(lang)}
                    </span>
                  ) : p.state === 'estimated' ? (
                    '≈'
                  ) : (
                    `${p.read.toLocaleString(lang)} / ${p.total.toLocaleString(lang)}`
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {messages.map(([s, message]) => (
        <p
          key={s}
          role={platforms[s]?.state === 'error' ? 'alert' : undefined}
          className={`text-xs rounded-lg px-2.5 py-1.5 ${platforms[s]?.state === 'error' ? 'bg-danger/10 text-text-main ring-1 ring-danger/30' : 'text-text-secondary'}`}
        >
          {message}
        </p>
      ))}
      {fill.active && <p className="text-xs text-text-secondary">{T.rankings.fillInRanking}</p>}
    </div>
  )
}
