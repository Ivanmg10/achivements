import type { ReactNode } from 'react'
import Link from 'next/link'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import Kicker from '@/components/ui/Kicker'

/**
 * The game being played (or played last) under the profile card, the same on
 * every platform: the game's tint under the neutral hairline, a small kicker, the game's icon,
 * title and console, its share on the right, what the game says the player is doing (RA's rich
 * presence, up to two lines, as the game wrote it) and the bar under it.
 */
export default function MainPageProfileNowPlaying({
  href,
  tintSrc,
  kicker,
  icon,
  title,
  sub,
  note,
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
  /** What the game says the player is doing; it was squeezed into the kicker, uppercase and cut (#128). */
  note?: string | null
  /** The share done, as shown on the right ("12,8 %"); nothing when unknown. */
  share?: string | null
  /** Finished: the share in the success colour (never the bar). */
  done?: boolean
  bar?: ReactNode
}) {
  return (
    <Link
      href={href}
      className="relative isolate rounded-pane px-3.5 py-3 flex flex-col gap-2.5 w-full focus-ring"
    >
      <GameCardBackdrop src={tintSrc} />
      <Kicker as="span" size="sm" className="truncate">{kicker}</Kicker>
      <span className="flex gap-3 items-center min-w-0">
        <span className="w-[3.25rem] h-[3.25rem] shrink-0 rounded-tile overflow-hidden shadow-[0_6px_18px_rgb(0_0_0/0.45)]">{icon}</span>
        <span className="flex flex-col min-w-0 flex-1">
          <span className="font-extrabold truncate">{title}</span>
          <span className="text-[0.8125rem] text-text-secondary truncate">{sub}</span>
        </span>
        {share && <strong className={`shrink-0 font-bold tabular-nums ${done ? 'text-success' : ''}`}>{share}</strong>}
      </span>
      {note && <span className="text-[0.8125rem] text-text-secondary line-clamp-2">{note}</span>}
      {bar}
    </Link>
  )
}
