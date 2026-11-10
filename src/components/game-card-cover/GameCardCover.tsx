import type { ReactNode } from 'react'
import Link from 'next/link'
import type { CoverRing } from '@/types/gameCard'

/** The size of a card's picture: the cover's box and the image inside it. */
export const COVER_IMAGE = 'block w-16 h-16 sm:w-24 sm:h-24'

const RING: Record<CoverRing, string> = {
  hardcore: 'ring-2 ring-hardcore/70 hover:ring-hardcore',
  'steam-perfect': 'ring-2 ring-steam-perfect/70 hover:ring-steam-perfect',
  platinum: 'ring-2 ring-platinum/70 hover:ring-platinum',
  success: 'ring-2 ring-success/70 hover:ring-success',
}

/**
 * A game card's picture, a link to the game. It goes to the same place as the title, so it is kept out of
 * the tab order and hidden from a screen reader. Ringed in the colour of a finished game, or on hover.
 */
export default function GameCardCover({ href, ring, children }: { href: string; ring?: CoverRing; children: ReactNode }) {
  return (
    <Link
      href={href}
      tabIndex={-1}
      aria-hidden="true"
      className={`relative z-10 shrink-0 rounded-tile overflow-hidden transition-all duration-150 ${COVER_IMAGE} ${ring ? RING[ring] : 'hover:ring-2 hover:ring-ink/40'}`}
    >
      {children}
    </Link>
  )
}
