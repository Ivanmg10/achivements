'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { steamAssetUrl, gameIconUrl, SteamAsset } from '@/lib/steamClient'

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
  /** 'icon' is the square desktop icon, falling back to the cover. */
  asset?: SteamAsset | 'icon'
  /** The 32×32 library icon — last resort before the placeholder. */
  iconUrl?: string
  alt?: string
  /** Rendered size in px, for the placeholder icon and image hints. */
  size: number
  className?: string
}) {
  const art = asset === 'icon' ? 'cover' : asset
  // A Set, because iconUrl is often the same icon route requested first.
  const sources = [...new Set([
    ...(asset === 'icon' ? [gameIconUrl(appId)] : []),
    steamAssetUrl(appId, art),
    ...(art !== 'header' ? [steamAssetUrl(appId, 'header')] : []),
    ...(iconUrl ? [iconUrl] : []),
  ])]
  const [index, setIndex] = useState(0)
  // Until a source has loaded, the box shows a pulsing placeholder in its own shape.
  const [loaded, setLoaded] = useState(false)
  // A cached image can finish before React attaches onLoad: check on mount.
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true)
  }, [])

  if (index >= sources.length) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`bg-[#1b2838] flex items-center justify-center ${className}`}
      >
        <SteamLogo size={Math.round(size / 2)} className="text-[#66c0f4]" aria-hidden="true" />
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
      // A portrait cover cut to a square keeps its top, where the title is printed.
      ref={ref}
      className={`object-cover ${art === 'cover' && sources[index] === steamAssetUrl(appId, 'cover') ? 'object-top' : ''} ${loaded ? '' : 'bg-ink/[0.06] animate-pulse motion-reduce:animate-none'} ${className}`}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setLoaded(false)
        setIndex((i) => i + 1)
      }}
      unoptimized
    />
  )
}
