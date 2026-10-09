'use client'

import Image from 'next/image'
import { useRaBoxArt } from '@/hooks/useRaBoxArt'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import type { GameSource } from '@/types/steam'

/**
 * A game's cover as its game page shows it: RA box art, Steam's portrait,
 * PSN's trophy-set icon (Sony gives no box art through this API).
 * Kept at its own proportions (box art runs from tall cases to wide labels);
 * the caller sets the height through `className` and the width follows.
 * Falls back to the RA icon while, or if, the box art does not come.
 */
export default function GameCover({
  source,
  id,
  iconUrl,
  className = 'h-32',
}: {
  source: GameSource
  id: number
  iconUrl?: string
  /** Height (and anything else) for the box the cover sits in. */
  className?: string
}) {
  const boxArt = useRaBoxArt(source === 'ra' ? [id] : [])
  const art = source === 'ra' ? boxArt[id] ?? iconUrl : source === 'psn' ? iconUrl : undefined
  const img = 'h-full w-auto max-w-full object-contain rounded-lg ring-1 ring-ink/10 shadow-xl shadow-black/40'

  const picture =
    source === 'steam' ? (
      <SteamGameImage appId={id} size={240} className={img} />
    ) : art ? (
      <Image src={art} alt="" width={240} height={320} unoptimized className={img} />
    ) : (
      <span className="h-full aspect-[3/4] rounded-lg bg-bg-main" />
    )

  return (
    <span className={`${className} relative max-w-full flex items-end justify-center`}>
      {picture}
    </span>
  )
}
