import type { CSSProperties } from 'react'

const RADIUS = {
  line: 'rounded-tag',
  chip: 'rounded-chip',
  tag: 'rounded-tag',
  tile: 'rounded-tile',
  pane: 'rounded-pane',
  control: 'rounded-control',
  button: 'rounded-button',
  field: 'rounded-field',
  card: 'rounded-card',
  /** Avatars and rings, round in both designs. */
  circle: 'rounded-full',
  /** A block flush with its card, which clips it. */
  none: 'rounded-none',
} as const

/** The pulse, for an element that cannot be a Skeleton (an image's own placeholder). */
export const SKELETON_PULSE = 'animate-pulse motion-reduce:animate-none'

/**
 * One block of a skeleton: size it with `className`, shape it with `radius`.
 * The colour and the radii are tokens, so every theme and both designs follow.
 * Decoration only: what it belongs to says it is loading (role="status",
 * aria-busy). A span, so it fits inside any element; it is a block.
 */
export function Skeleton({ radius = 'line', className = '', style }: { radius?: keyof typeof RADIUS; className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" style={style} className={`block bg-skeleton ${SKELETON_PULSE} ${RADIUS[radius]} ${className}`} />
}
