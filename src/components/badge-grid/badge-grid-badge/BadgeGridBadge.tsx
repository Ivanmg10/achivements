'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ConcealedBadge from '@/components/concealed-badge/ConcealedBadge'
import RevealSecretButton from '@/components/reveal-secret-button/RevealSecretButton'
import PinAchievementButton from '@/components/pin-achievement-button/PinAchievementButton'

export const BADGE_SIZES = {
  40: { badge: 'w-10 h-10', img: 40 },
  48: { badge: 'w-12 h-12', img: 48 },
} as const

const BADGE_CLASS =
  'block rounded-box overflow-hidden shrink-0 transition-transform duration-100 hover:scale-110 focus-visible:scale-110 hover:z-10 relative focus-ring'

/**
 * One badge of a grid: the picture (greyed while locked, a stand-in when it has none or is secret), a ring
 * once earned, a link to the achievement or a button that opens it, and the star and the eye in its corners.
 * The name is in its accessible label, so the colours are never the only cue.
 */
export default function BadgeGridBadge({
  href,
  onSelect,
  label,
  ring,
  earned,
  iconUrl,
  size,
  corner,
  eye,
  pin,
  onShow,
  onHide,
}: {
  /** A link to the achievement on its game page... */
  href?: string
  /** ...or a button that opens it (RA's window). */
  onSelect?: () => void
  label: string
  /** The ring an earned badge wears; none leaves it bare. */
  ring?: string
  earned: boolean
  /** Null: no picture to show. */
  iconUrl: string | null
  size: keyof typeof BADGE_SIZES
  /** Over the badge's corner (RA's missable mark). */
  corner?: ReactNode
  eye?: { revealed: boolean; onToggle: () => void; labels: { reveal: string; conceal: string } }
  pin?: { pinned: boolean; title: string; onToggle: () => void }
  onShow: (x: number, y: number, delay?: number) => void
  onHide: () => void
}) {
  const dims = BADGE_SIZES[size]
  const props = {
    'aria-label': label,
    onMouseEnter: (e: React.MouseEvent) => onShow(e.clientX, e.clientY),
    onMouseLeave: onHide,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      onShow(r.right, r.top, 0)
    },
    onBlur: onHide,
    className: `${BADGE_CLASS} ${ring ? `ring-2 ${ring}` : ''} ${onSelect ? 'cursor-pointer' : ''}`,
  }
  const picture = iconUrl ? (
    <Image
      src={iconUrl}
      alt=""
      width={dims.img}
      height={dims.img}
      className={`${dims.badge} object-cover ${earned ? '' : 'grayscale opacity-40'}`}
      unoptimized
    />
  ) : (
    <ConcealedBadge sizeClass={dims.badge} dim={!earned} />
  )
  const content = (
    <>
      {picture}
      {corner}
    </>
  )

  return (
    <li className="relative group/badge">
      {href ? (
        <Link href={href} {...props}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          {...props}
          onClick={() => {
            onHide()
            onSelect?.()
          }}
        >
          {content}
        </button>
      )}
      {eye && (
        <RevealSecretButton
          revealed={eye.revealed}
          onToggle={eye.onToggle}
          labels={eye.labels}
          className="z-20 w-8 h-8 opacity-0 group-hover/badge:opacity-100 focus-visible:opacity-100"
        />
      )}
      {pin && (
        <PinAchievementButton
          pinned={pin.pinned}
          title={pin.title}
          onToggle={pin.onToggle}
          size={12}
          className={`absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-bg-card/90 flex items-center justify-center ${
            pin.pinned ? 'opacity-100' : 'opacity-0 group-hover/badge:opacity-100 focus-visible:opacity-100'
          }`}
        />
      )}
    </li>
  )
}
