'use client'

import { ReactNode, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import VaultFillLine from '@/components/vault-fill-line/VaultFillLine'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import Button, { buttonClass } from '@/components/ui/Button'
import Figure, { type FigureTone } from '@/components/ui/Figure'
import type { GameSource } from '@/types/game'

// Downloaded the first time it is wanted, not with the page.
const PlatformUnlinkDialog = dynamic(() => import('@/components/user-page/platform-unlink-dialog/PlatformUnlinkDialog'), { loading: () => null })

export type PlatformStat = { label: string; value: string; tone?: FigureTone; loading?: boolean }

/**
 * A figure of a platform card. While it is on its way it is `loading` (a skeleton in its place);
 * the dash is only for a value that is truly absent.
 */
export function platformStat(
  label: string,
  value: string | number | null | undefined,
  { lang, loading = false, tone }: { lang: string; loading?: boolean; tone?: FigureTone },
): PlatformStat {
  const text = value === null || value === undefined || value === '' ? '—' : typeof value === 'number' ? value.toLocaleString(lang) : value
  return { label, value: text, tone, loading }
}

export const CONNECT_CLASS = buttonClass('primary', 'md', 'w-full')

/** Who the account is on the platform: its picture (or `fallback`), its name, its id and a note under them. */
export type PlatformIdentity = { avatar?: string | null; fallback?: ReactNode; name: string; id?: string | null; note?: string }

/** The disconnect: its name (for a screen reader), the hook's unlink (true when it worked) and the toast that says so. */
export type PlatformDisconnect = { label: string; busyLabel?: string; run: () => Promise<boolean>; done: string }

/**
 * One platform on the account page: its logo, whether it is connected, the
 * account it is connected as, its headline numbers, and the one button that
 * changes anything: connect, or a small disconnect beside "Connected" that asks first.
 *
 * The shell is shared so the platforms read as the same kind of thing; each
 * one is outlined in its own gradient so they are still told apart at a
 * glance. Disconnected, the card shows its logo and what connecting is for
 * instead of empty space. Disconnecting is the card's: a small quiet button
 * (no red: the red is in its confirmation, #132), held while it runs, and a
 * toast either way.
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
  disconnect,
  source,
}: {
  name: string
  /** The user's own page on the platform; the name links to it once connected. */
  href?: string
  logo: ReactNode
  /** The same logo, larger, for the disconnected state. */
  bigLogo?: ReactNode
  /** Gradient stops for the card's outline, e.g. "from-steam to-steam-dark". */
  gradient: string
  connected: boolean
  /** A message about the last connection attempt. */
  status?: ReactNode
  /** Account details once connected. */
  identity?: PlatformIdentity | null
  /** What connecting this platform gets you. */
  hint?: string
  /** Four or five headline numbers, side by side. */
  stats?: PlatformStat[]
  /** What connects it, shown while it is not connected. */
  action?: ReactNode
  /** How to disconnect it, shown while it is connected. */
  disconnect?: PlatformDisconnect
  /** The platform, for its Vault Points being calculated right after it is linked. */
  source?: GameSource
}) {
  const { T } = useLanguage()
  const [unlinking, setUnlinking] = useState(false)
  const [asking, setAsking] = useState(false)

  const handleDisconnect = async () => {
    if (!disconnect) return
    setUnlinking(true)
    const ok = await disconnect.run()
    setUnlinking(false)
    setAsking(false)
    if (ok) notify.success(disconnect.done)
    else notify.error(T.toast.unlinkFailed)
  }

  return (
    <div className={`rounded-[calc(var(--r-card)+1px)] p-px bg-gradient-to-br ${gradient}`}>
      <section
        aria-label={name}
        className="relative h-full bg-bg-card rounded-card p-5 flex flex-col gap-3 overflow-hidden"
      >
        <div className="relative flex flex-col gap-1">
          <span className="flex items-center gap-2 min-w-0">
            {logo}
            {connected && href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} — ${T.userData.openProfile}`}
                className="font-extrabold truncate hover:underline rounded focus-ring"
              >
                {name}
              </a>
            ) : (
              <span className="font-extrabold truncate">{name}</span>
            )}
          </span>
          {/* One height connected or not, so the figures start at the same place in every card of the row. */}
          <span className="flex items-center justify-between gap-2 min-h-(--h-control-sm)">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${connected ? 'text-success' : 'text-text-secondary'}`}>
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />
              {connected ? T.userData.connected : T.userData.notConnected}
            </span>
            {connected && disconnect && (
              <Button variant="quiet" size="sm" aria-label={disconnect.label} aria-haspopup="dialog" onClick={() => setAsking(true)}>
                {T.userData.disconnect}
              </Button>
            )}
          </span>
        </div>

        {status}

        {connected ? (
          <>
            {identity && (
              <div className="rounded-tile bg-ink/[0.03] p-2.5 flex items-center gap-3 min-w-0">
                {identity.avatar ? (
                  <Image src={identity.avatar} alt="" width={44} height={44} className="rounded-box w-10 h-10 object-cover shrink-0" unoptimized />
                ) : (
                  identity.fallback
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold truncate">{identity.name}</span>
                  {identity.id && <span className="text-[0.6875rem] text-text-secondary truncate">{identity.id}</span>}
                  {identity.note && <span className="text-[10px] text-text-secondary">{identity.note}</span>}
                </div>
              </div>
            )}
            {stats.length > 0 && (
              <dl className="grid grid-cols-2 gap-1.5">
                {stats.map((stat, i) => (
                  <Figure
                    key={stat.label}
                    look="card"
                    compact
                    term
                    {...stat}
                    /* An odd count leaves the last one alone on its row: let it fill it. */
                    className={stats.length % 2 === 1 && i === stats.length - 1 ? 'col-span-2' : ''}
                  />
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

        {(!connected || !disconnect) && action && <div className="relative mt-auto">{action}</div>}
      </section>
      {disconnect && (
        <LazyWhenOpened open={asking}>
          <PlatformUnlinkDialog
            isOpen={asking}
            onClose={() => setAsking(false)}
            onConfirm={handleDisconnect}
            name={name}
            busy={unlinking}
            busyLabel={disconnect.busyLabel}
          />
        </LazyWhenOpened>
      )}
    </div>
  )
}
