'use client'

import { useImageTint, NEUTRAL_TINT } from '@/hooks/useImageTint'
import { useGameCardStyle, type GameCardStyle } from '@/hooks/useGameCardStyle'

const BASE = {
  main: 'rgb(var(--bg-main))',
  card: 'rgb(var(--bg-card))',
}

/**
 * The game's colour behind a card: a flat tint of it fading toward the text
 * side (the user's choice over the blurred art, 2026-10-24). Both styles ring
 * the card with the same neutral hairline; only the tint is the game's. The
 * colour is read from the game's art (`useImageTint`); until it is, or if
 * the art's host does not allow it, a neutral grey. With the flat style chosen
 * (`useGameCardStyle`) there is no tint at all: the card's plain surface.
 */
export default function GameCardBackdrop({
  src,
  surface = 'main',
  style: forced,
}: {
  src?: string | null
  /** The card's own background, under the tint. */
  surface?: keyof typeof BASE
  /** Draw this style whatever the person chose (the design system's catalogue shows both). */
  style?: GameCardStyle
  /** Kept for callers; the tint needs no image on screen. */
  eager?: boolean
}) {
  const [chosen] = useGameCardStyle()
  const style = forced ?? chosen
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
      className="absolute inset-0 -z-10 rounded-[inherit] pointer-events-none transition-[background] duration-(--motion-open)"
      style={{
        background: `linear-gradient(90deg, rgb(${tint} / 0.24), rgb(${tint} / 0.07) 45%, transparent 75%), ${BASE[surface]}`,
        boxShadow: 'inset 0 0 0 1px rgb(var(--ink) / 0.08)',
      }}
    />
  )
}
