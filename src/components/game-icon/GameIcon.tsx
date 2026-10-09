'use client'

import Image from 'next/image'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import type { GameSource } from '@/types/steam'

/**
 * A game's square icon on any platform: Steam's from its CDN (with its own
 * fallbacks), RA's and PSN's from the URL given. A grey square when there is
 * none. The caller sizes it through `className`.
 */
export default function GameIcon({
  source,
  id,
  imageUrl,
  size,
  className = '',
}: {
  source: GameSource
  id: number
  /** Full URL (RA's already prefixed). Steam uses it only as a last resort. */
  imageUrl?: string | null
  /** Rendered size in px, for image hints. */
  size: number
  className?: string
}) {
  if (source === 'steam') {
    return <SteamGameImage appId={id} asset="icon" iconUrl={imageUrl ?? undefined} size={size} className={className} />
  }
  if (!imageUrl) return <span aria-hidden="true" className={`block bg-ink/10 ${className}`} />
  return <Image src={imageUrl} alt="" width={size} height={size} className={`object-cover ${className}`} unoptimized />
}
