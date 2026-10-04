'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAvatarPalette } from '@/hooks/useAvatarPalette'

/**
 * The wash across the top of the account card, made from the user's own
 * avatar. For an uploaded avatar its two main colours are read from the
 * pixels and blended into each other; a pasted link from another host cannot
 * be read, so there the picture itself is blown up and blurred until only its
 * colours are left. Without an avatar, or if it fails, it is a quiet wash of
 * the theme's accent. Either way it melts down into the card. Decoration only.
 */
export default function UserProfileBanner({ avatar }: { avatar?: string | null }) {
  const [failed, setFailed] = useState(false)
  const palette = useAvatarPalette(avatar)
  const show = avatar && !failed && !palette

  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-56 sm:h-64 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(var(--accent)/0.25),transparent_60%)]" />
      {palette && (
        <div
          data-testid="avatar-palette"
          className="absolute inset-0 opacity-70 bg-[radial-gradient(ellipse_70%_120%_at_15%_0%,var(--c1),transparent_70%),radial-gradient(ellipse_70%_120%_at_85%_10%,var(--c2),transparent_70%)]"
          style={{ '--c1': `rgb(${palette[0].join(' ')})`, '--c2': `rgb(${palette[1].join(' ')})` } as React.CSSProperties}
        />
      )}
      {show && (
        <Image
          src={avatar}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          onError={() => setFailed(true)}
          className="object-cover scale-150 blur-3xl saturate-150 opacity-60"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-card/50 to-bg-card" />
    </div>
  )
}
