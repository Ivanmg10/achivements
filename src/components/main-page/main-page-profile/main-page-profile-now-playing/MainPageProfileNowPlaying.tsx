import type { ReactNode } from 'react'
import Link from 'next/link'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'

/**
 * The game being played (or played last) under the profile card, the same on
 * every platform: the game's tint and border, a small kicker (with what the
 * game says the player is doing, when it says), the game's icon, title and
 * console, its share on the right and the bar under it.
 */
export default function MainPageProfileNowPlaying({
  href,
  tintSrc,
  kicker,
  icon,
  title,
  sub,
  share,
  done = false,
  bar,
}: {
  href: string
  /** The picture the card takes its colour from. */
  tintSrc: string | null
  kicker: string
  icon: ReactNode
  title: string
  sub: ReactNode
  /** The share done, as shown on the right ("12,8 %"); nothing when unknown. */
  share?: string | null
  /** Finished: the share in the success colour (never the bar). */
  done?: boolean
  bar?: ReactNode
}) {
  return (
    <Link
      href={href}
      className="relative isolate rounded-[0.875rem] px-3.5 py-3 flex flex-col gap-2.5 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <GameCardBackdrop src={tintSrc} />
      <span className="text-[0.6875rem] font-bold uppercase tracking-[0.09em] text-text-secondary truncate">{kicker}</span>
      <span className="flex gap-3 items-center min-w-0">
        <span className="w-[3.25rem] h-[3.25rem] shrink-0 rounded-xl overflow-hidden shadow-[0_6px_18px_rgb(0_0_0/0.45)]">{icon}</span>
        <span className="flex flex-col min-w-0 flex-1">
          <span className="font-extrabold truncate">{title}</span>
          <span className="text-[0.8125rem] text-text-secondary truncate">{sub}</span>
        </span>
        {share && <strong className={`shrink-0 font-bold tabular-nums ${done ? 'text-success' : ''}`}>{share}</strong>}
      </span>
      {bar}
    </Link>
  )
}
