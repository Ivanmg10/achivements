'use client'

import { useImageTint, NEUTRAL_TINT } from '@/hooks/useImageTint'
import { useGameCardStyle } from '@/hooks/useGameCardStyle'

const BASE = {
  main: 'rgb(var(--bg-main))',
  card: 'rgb(var(--bg-card))',
}

/**
 * The game's colour behind a card: a flat tint of it fading toward the text
 * side and a border in it (the user's choice over the blurred art, 2026-10-24).
 * The colour is read from the game's art (`useImageTint`); until it is, or if
 * the art's host does not allow it, a neutral grey. With the flat style chosen
 * (`useGameCardStyle`) it is the card's plain surface and a hairline instead.
 */
export default function GameCardBackdrop({
  src,
  surface = 'main',
}: {
  src?: string | null
  /** The card's own background, under the tint. */
  surface?: keyof typeof BASE
  /** Kept for callers; the tint needs no image on screen. */
  eager?: boolean
}) {
  const [style] = useGameCardStyle()
  // A flat card reads no colour from the art at all.
  const tint = useImageTint(style === 'flat' ? null : src) ?? NEUTRAL_TINT

  if (style === 'flat') {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-[inherit] pointer-events-none"
        style={{ background: BASE[surface], boxShadow: 'inset 0 0 0 1px rgb(var(--ink) / 0.08)' }}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 rounded-[inherit] pointer-events-none transition-[box-shadow,background] duration-(--motion-open)"
      style={{
        background: `linear-gradient(90deg, rgb(${tint} / 0.24), rgb(${tint} / 0.07) 45%, transparent 75%), ${BASE[surface]}`,
        boxShadow: `inset 0 0 0 1px rgb(${tint} / 0.45)`,
      }}
    />
  )
}
