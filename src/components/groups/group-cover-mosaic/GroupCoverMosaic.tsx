import Image from 'next/image'
import { IconFolder } from '@tabler/icons-react'
import type { GameGroup } from '@/types/types'

const isUrl = (s: string) => /^https?:\/\//i.test(s)

/** A cover as stored: RA art is a path on retroachievements.org, Steam art a link already. */
function coverSrc(c: NonNullable<GameGroup['covers']>[number]): string | null {
  if (!c.image_icon) return null
  return c.source === 'steam' || c.image_icon.startsWith('/api/') || isUrl(c.image_icon)
    ? c.image_icon
    : `https://retroachievements.org${c.image_icon}`
}

// How the tile is split for 1 to 4 covers.
const LAYOUT: Record<number, string> = {
  1: 'grid-cols-1 grid-rows-1',
  2: 'grid-cols-2 grid-rows-1',
  3: 'grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2',
  4: 'grid-cols-2 grid-rows-2',
}

/**
 * A group's face: its first games' covers in a square, with the icon its
 * owner chose (emoji or image) on a corner. No games yet: the icon alone, or a
 * folder. Decorative; the card's title names the group.
 */
export default function GroupCoverMosaic({ group, size = 'w-24 h-24' }: { group: GameGroup; size?: string }) {
  const covers = (group.covers ?? []).map(coverSrc).filter((s): s is string => !!s).slice(0, 4)
  const icon = group.icon?.trim() || null

  const iconMark = icon ? (
    isUrl(icon) ? (
      <Image src={icon} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
    ) : (
      <span className="leading-none">{icon}</span>
    )
  ) : null

  return (
    <div aria-hidden="true" className={`relative shrink-0 ${size}`}>
      {covers.length > 0 ? (
        <div className={`grid gap-0.5 w-full h-full rounded-xl overflow-hidden bg-bg-main ${LAYOUT[covers.length]}`}>
          {covers.map((src, i) => (
            <Image key={i} src={src} alt="" width={96} height={96} className="w-full h-full object-cover" unoptimized />
          ))}
        </div>
      ) : (
        <div className="w-full h-full rounded-xl bg-bg-main flex items-center justify-center text-4xl">
          {iconMark ?? <IconFolder className="w-8 h-8 text-text-secondary" />}
        </div>
      )}
      {covers.length > 0 && iconMark && (
        <span className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-bg-card ring-2 ring-bg-card overflow-hidden flex items-center justify-center text-lg">
          {iconMark}
        </span>
      )}
    </div>
  )
}
