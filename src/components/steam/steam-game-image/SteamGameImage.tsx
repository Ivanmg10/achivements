'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IconBrandSteam } from '@tabler/icons-react'
import { steamAssetUrl, SteamAsset } from '@/lib/steamClient'

/**
 * Official Steam artwork for a game, falling back when an asset is missing.
 *
 * The library icon Steam hands out with the game list is 32×32 — far too small
 * for a card. The 600×900 cover and the other CDN assets exist for nearly
 * every game (all of the 40 most-played in a real library), but not all, so
 * each failed load steps down: the requested asset → the store header → the
 * small icon → a Steam placeholder.
 */
export default function SteamGameImage({
  appId,
  asset = 'cover',
  iconUrl,
  alt = '',
  size,
  className = '',
}: {
  appId: number
  asset?: SteamAsset
  /** The 32×32 library icon — last resort before the placeholder. */
  iconUrl?: string
  alt?: string
  /** Rendered size in px, for the placeholder icon and image hints. */
  size: number
  className?: string
}) {
  const sources = [
    steamAssetUrl(appId, asset),
    ...(asset !== 'header' ? [steamAssetUrl(appId, 'header')] : []),
    ...(iconUrl ? [iconUrl] : []),
  ]
  const [index, setIndex] = useState(0)

  if (index >= sources.length) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`bg-[#1b2838] flex items-center justify-center ${className}`}
      >
        <IconBrandSteam size={Math.round(size / 2)} className="text-[#66c0f4]" aria-hidden="true" />
      </div>
    )
  }

  return (
    <Image
      // Re-mount on each step so the browser does not keep the failed request.
      key={sources[index]}
      src={sources[index]}
      alt={alt}
      width={size}
      height={size}
      className={`object-cover ${className}`}
      onError={() => setIndex((i) => i + 1)}
      unoptimized
    />
  )
}
