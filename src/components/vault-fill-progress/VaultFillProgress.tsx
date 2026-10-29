'use client'

import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useVaultFillState } from '@/context/VaultFillContext'
import type { GameSource } from '@/types/steam'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PLATFORM_FILL, PLATFORM_NAMES, PLATFORM_ORDER } from '@/components/vault-platform-split/VaultPlatformSplit'
import { fillMessage } from '@/utils/vaultFill'

/**
 * How the Vault Points fill is getting on, one small card per platform: games
 * read of the total with a short bar, a tick when done (and how many the
 * platform would not answer for), and below, what to do when one failed (a
 * private profile, a refused key) or why it waits. While the fill runs, and
 * whenever a platform needs the user; nothing otherwise. `wide` lays the cards
 * four in a row where there is room (the account page); two otherwise.
 */
export default function VaultFillProgress({ wide = false, className = '' }: { wide?: boolean; className?: string }) {
  const { T, lang } = useLanguage()
  const fill = useVaultFillState()
  const platforms = fill?.status?.platforms ?? {}
  const sources = PLATFORM_ORDER.filter((s) => platforms[s])
  const messages = sources.map((s) => [s, fillMessage(s, platforms[s]!, T.rankings)] as const).filter((m): m is readonly [GameSource, string] => m[1] !== null)
  if (!fill || (!fill.active && messages.every(([s]) => platforms[s]?.state !== 'error'))) return null
  const n = (x: number) => x.toLocaleString(lang)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {fill.active && (
        <ul className={`grid grid-cols-2 gap-2 ${wide ? 'lg:grid-cols-4' : ''}`}>
          {sources.map((s) => {
            const p = platforms[s]!
            const done = p.state === 'done'
            const failed = p.state === 'error'
            const counted = p.read + (p.skipped ?? 0)
            return (
              <li key={s} className="bg-bg-main rounded-tile px-3 py-2 flex flex-col gap-1.5 min-w-0">
                <span className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 min-w-0 font-medium">
                    <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${PLATFORM_FILL[s]}`} />
                    <span className="truncate">{PLATFORM_NAMES[s]}</span>
                  </span>
                  <span className={`tabular-nums shrink-0 ${done ? 'text-success font-semibold' : failed ? 'text-danger' : 'text-text-secondary'}`}>
                    {done ? (
                      <span className="inline-flex items-center gap-0.5">
                        <IconCheck size={12} aria-hidden="true" />
                        {n(p.read)}
                      </span>
                    ) : p.state === 'estimated' ? (
                      '≈'
                    ) : failed ? (
                      '—'
                    ) : (
                      `${n(counted)} / ${n(p.total)}`
                    )}
                  </span>
                </span>
                <ProgressBar
                  pct={failed ? 0 : done ? 100 : p.total > 0 ? (counted / p.total) * 100 : 0}
                  label={`${PLATFORM_NAMES[s]}: ${T.rankings.fillGames.replace('{n}', n(counted)).replace('{total}', n(p.total))}`}
                  height="h-1"
                />
                {(p.skipped ?? 0) > 0 && <span className="text-[10.5px] text-text-secondary leading-tight">{T.rankings.fillSkipped.replace('{n}', n(p.skipped!))}</span>}
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
