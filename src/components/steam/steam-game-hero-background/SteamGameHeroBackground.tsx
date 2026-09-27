'use client'

import { useState } from 'react'
import { steamAssetUrl } from '@/lib/steamClient'

/**
 * The blurred artwork behind a Steam game page, as the RA page does with its
 * title screen. Uses the 1920×620 library banner, falling back to the store
 * header, and simply drops out if neither exists — it is decoration.
 */
export default function SteamGameHeroBackground({ appId }: { appId: number }) {
  const sources = [steamAssetUrl(appId, 'hero'), steamAssetUrl(appId, 'header')]
  const [index, setIndex] = useState(0)

  if (index >= sources.length) return null

  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none overflow-hidden"
      style={{ top: '-64px', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '900px' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a blurred backdrop, as on the RA page */}
      <img
        key={sources[index]}
        src={sources[index]}
        alt=""
        onError={() => setIndex((i) => i + 1)}
        className="w-full h-full object-cover object-top opacity-60 scale-110"
        style={{ filter: 'blur(16px)' }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-main/60 to-bg-main" />
      <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-black/40 via-black/15 to-transparent" />
    </div>
  )
}
