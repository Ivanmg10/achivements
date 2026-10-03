'use client'

import { useState } from 'react'
import Image from 'next/image'

const FADE = {
  main: 'from-bg-main/30 via-bg-main/80 to-bg-main',
  card: 'from-bg-card/30 via-bg-card/80 to-bg-card',
}

/**
 * The game's own art, blown up and blurred behind a card, fading out toward
 * the text side. Gives each card its game's colour without touching the
 * theme: it sits under the card's content at low opacity, so any theme's
 * surface still reads through. Drops itself if the image fails to load.
 */
export default function GameCardBackdrop({
  src,
  surface = 'main',
  eager = false,
}: {
  src?: string | null
  /** The card's own background, which the art fades into. */
  surface?: keyof typeof FADE
  /** The first card on screen: its art is the page's largest paint, so it loads first. */
  eager?: boolean
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit] pointer-events-none">
      <Image
        src={src}
        alt=""
        width={96}
        height={96}
        unoptimized
        {...(eager ? { loading: 'eager' as const, fetchPriority: 'high' as const } : {})}
        onError={() => setFailed(true)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 w-64 h-64 max-w-none object-cover blur-2xl saturate-150 opacity-30"
      />
      <div className={`absolute inset-0 bg-linear-to-r ${FADE[surface]}`} />
    </div>
  )
}
