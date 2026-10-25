'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameSource } from '@/types/steam'
import VaultFillLine from '@/components/vault-fill-line/VaultFillLine'
import { buttonClass } from '@/components/ui/Button'

export type PlatformStat = { label: string; value: string; accent?: string }

export const DISCONNECT_CLASS = buttonClass('danger', 'md', 'w-full')
export const CONNECT_CLASS = buttonClass('primary', 'md', 'w-full')

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
  href,
  logo,
  bigLogo,
  gradient,
  connected,
  status,
  identity,
  hint,
  stats = [],
  action,
  source,
}: {
  name: string
  /** The user's own page on the platform; the name links to it once connected. */
  href?: string
  logo: ReactNode
  /** The same logo, larger, for the disconnected state. */
  bigLogo?: ReactNode
  /** Gradient stops for the card's outline, e.g. "from-[#66c0f4] to-[#1b2838]". */
  gradient: string
  connected: boolean
  /** A message about the last connection attempt. */
  status?: ReactNode
  /** Account details once connected. */
  identity?: ReactNode
  /** What connecting this platform gets you. */
  hint?: string
  /** Four or five headline numbers, side by side. */
  stats?: PlatformStat[]
  action?: ReactNode
  /** The platform, for its Vault Points being calculated right after it is linked. */
  source?: GameSource
}) {
  const { T } = useLanguage()

  return (
    <div className={`rounded-[calc(var(--r-card)+1px)] p-px bg-gradient-to-br ${gradient}`}>
      <section
        aria-label={name}
        className="relative h-full bg-bg-card rounded-card p-5 flex flex-col gap-3 overflow-hidden"
      >
        <div className="relative flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            {logo}
            {connected && href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} — ${T.userData.openProfile}`}
                className="font-extrabold truncate hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {name}
              </a>
            ) : (
              <span className="font-extrabold truncate">{name}</span>
            )}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold shrink-0 ${connected ? 'text-success' : 'text-text-secondary'}`}
          >
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
            {connected ? T.userData.connected : T.userData.notConnected}
          </span>
        </div>

        {status}

        {connected ? (
          <>
            {identity && <div className="rounded-xl bg-ink/[0.03] p-2.5">{identity}</div>}
            {stats.length > 0 && (
              <dl className="grid grid-cols-2 gap-1.5">
                {stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    /* An odd count leaves the last one alone on its row: let it fill it. */
                    className={`bg-bg-main rounded-xl px-3 py-2.5 flex flex-col min-w-0 ${
                      stats.length % 2 === 1 && i === stats.length - 1 ? 'col-span-2' : ''
                    }`}
                  >
                    <dt className="text-xs text-text-secondary truncate">{stat.label}</dt>
                    <dd className={`text-xl font-extrabold tabular-nums truncate ${stat.accent ?? 'text-text-main'}`}>
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {source && <VaultFillLine source={source} />}
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
