'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export type PlatformStat = { label: string; value: string; accent?: string }

/**
 * One platform on the account page: its logo, whether it is connected, the
 * account it is connected as, its headline numbers, and the one button that
 * changes anything — connect or disconnect.
 *
 * The shell is shared so RetroAchievements, Steam and PlayStation read as the
 * same kind of thing; each card passes its own identity, numbers and accent.
 * A platform that is not available yet passes `soon`.
 */
export default function UserPlatformCard({
  name,
  logo,
  accent,
  connected,
  soon = false,
  status,
  identity,
  stats = [],
  action,
}: {
  name: string
  logo: ReactNode
  /** Tailwind classes tinting the card's top edge. */
  accent: string
  connected: boolean
  soon?: boolean
  /** A message about the last connection attempt. */
  status?: ReactNode
  /** Account details once connected. */
  identity?: ReactNode
  /** Four or five headline numbers, side by side. */
  stats?: PlatformStat[]
  action?: ReactNode
}) {
  const { T } = useLanguage()

  return (
    <section
      aria-label={name}
      className={`relative bg-bg-card rounded-3xl p-5 flex flex-col gap-4 ring-1 ring-white/5 overflow-hidden ${
        soon ? 'opacity-60' : ''
      }`}
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          {logo}
          <span className="font-semibold truncate">{name}</span>
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            connected && !soon ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-text-secondary'
          }`}
        >
          {soon ? T.userData.comingSoon : connected ? T.userData.connected : T.userData.notConnected}
        </span>
      </div>

      {status}

      {identity}

      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-2">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              /* An odd count leaves the last one alone on its row: let it fill it. */
              className={`bg-bg-main rounded-xl px-3 py-2.5 flex flex-col gap-0.5 min-w-0 ${
                stats.length % 2 === 1 && i === stats.length - 1 ? 'col-span-2' : ''
              }`}
            >
              <dt className="text-[11px] text-text-secondary truncate">{stat.label}</dt>
              <dd className={`text-lg font-bold tabular-nums truncate ${stat.accent ?? 'text-text-main'}`}>
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-auto">{action}</div>
    </section>
  )
}
