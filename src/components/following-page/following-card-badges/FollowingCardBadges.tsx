'use client'

import { useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { FriendPin } from '@/utils/friends'
import { gameHref } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { TOOLTIP_SURFACE } from '@/components/ui/tooltip'

const SIZE = {
  md: { px: 40, box: 'w-10 h-10 rounded-lg', gap: 'gap-1.5' },
  sm: { px: 28, box: 'w-7 h-7 rounded-md', gap: 'gap-1' },
}

/**
 * A row of achievement badges (pinned or just earned), each opening its game
 * on the person's page. Hovering or focusing one shows its game, name and
 * description above the row.
 */
export default function FollowingCardBadges({
  items,
  username,
  label,
  size = 'md',
}: {
  items: FriendPin[]
  username: string
  /** What the row is, for screen readers. */
  label: string
  size?: keyof typeof SIZE
}) {
  const baseId = useId()
  const { px, box, gap } = SIZE[size]

  return (
    <ul aria-label={label} className={`relative flex ${gap}`}>
      {items.map((p, i) => {
        const tip = `${baseId}-${i}`
        return (
          <li key={`${p.source}:${p.gameId}:${i}`} className="group">
            <Link
              href={gameHref(p.source, p.gameId, username)}
              aria-label={`${p.title ?? '—'} · ${p.gameTitle}`}
              aria-describedby={p.description ? tip : undefined}
              className="block rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {p.badge ? (
                <Image src={p.badge} alt="" width={px} height={px} className={`${box} object-cover`} unoptimized />
              ) : (
                <span aria-hidden="true" className={`block ${box} bg-ink/10`} />
              )}
            </Link>
            {/* Above the row and from its left edge, so it never runs off the card. */}
            <span
              role="tooltip"
              id={tip}
              className={`pointer-events-none absolute bottom-full left-0 mb-2 w-64 max-w-[80vw] z-20 ${TOOLTIP_SURFACE} px-3 py-2 flex flex-col gap-0.5 opacity-0 invisible transition-opacity group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible`}
            >
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-secondary">
                <PlatformLogo source={p.source} size={10} />
                <span className="truncate">{p.gameTitle}</span>
              </span>
              <span className="text-sm font-semibold text-text-main">{p.title ?? '—'}</span>
              {p.description && <span className="text-xs text-text-secondary">{p.description}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
