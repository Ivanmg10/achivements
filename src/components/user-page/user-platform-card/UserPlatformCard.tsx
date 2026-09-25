'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export type PlatformStat = { label: string; value: string; accent?: string }

/**
 * One platform on the account page: its logo, whether it is connected, the
 * account it is connected as, its headline numbers, and the one button that
 * changes anything — connect or disconnect.
 *
 * The shell is shared so the platforms read as the same kind of thing; each
 * one is outlined in its own gradient so they are still told apart at a
 * glance. Disconnected, the card shows its logo and what connecting is for
 * instead of empty space.
 */
export default function UserPlatformCard({
  name,
  logo,
  bigLogo,
  gradient,
  connected,
  soon = false,
  status,
  identity,
  hint,
  stats = [],
  action,
}: {
  name: string
  logo: ReactNode
  /** The same logo, larger, for the disconnected state. */
  bigLogo?: ReactNode
  /** Gradient stops for the card's outline, e.g. "from-[#66c0f4] to-[#1b2838]". */
  gradient: string
  connected: boolean
  soon?: boolean
  /** A message about the last connection attempt. */
  status?: ReactNode
  /** Account details once connected. */
  identity?: ReactNode
  /** What connecting this platform gets you. */
  hint?: string
  /** Four or five headline numbers, side by side. */
  stats?: PlatformStat[]
  action?: ReactNode
}) {
  const { T } = useLanguage()

  return (
    <div className={`rounded-3xl p-px bg-gradient-to-br ${gradient} ${soon ? 'opacity-70' : ''}`}>
      <section
        aria-label={name}
        className="relative h-full bg-bg-card rounded-[calc(1.5rem-1px)] p-5 flex flex-col gap-4 overflow-hidden"
      >
        <div className="relative flex items-center justify-between gap-2">
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

        {connected ? (
          <>
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
          </>
        ) : (
          <div className="relative flex-1 flex flex-col items-center justify-center gap-3 text-center py-6">
            {bigLogo && <span className="opacity-40">{bigLogo}</span>}
            {hint && <p className="text-sm text-text-secondary max-w-60">{hint}</p>}
          </div>
        )}

        <div className="relative mt-auto">{action}</div>
      </section>
    </div>
  )
}
