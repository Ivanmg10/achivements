import type { CSSProperties } from 'react'

const TONES = {
  accent: 'bg-accent',
  soft: 'bg-accent/35',
  muted: 'bg-ink/10',
}

/**
 * A bar of a chart: as long (`x`) or as tall (`y`) as its share. Upright in
 * both designs, as data never leans (identity B, #127): square ends in the
 * slanted design, rounded in the round one (`--bar-radius`). Decorative: the
 * number it stands for is written beside it. `track` draws the rest of the way
 * under a horizontal bar. Its parent sizes it: the width of an `x` bar's row,
 * the height of a `y` bar's column.
 */
export default function DataBar({
  share,
  axis = 'x',
  tone = 'accent',
  color,
  track = false,
  min = 0,
  grow = false,
  className = '',
  style,
}: {
  /** 0 to 1. */
  share: number
  axis?: 'x' | 'y'
  tone?: keyof typeof TONES
  /** A hue that is not a theme one (a streak tier); wins over `tone`. */
  color?: string
  track?: boolean
  /** The least it shows, in px, so a small share is still seen. */
  min?: number
  /** Grows from its base as it enters (`.enter-grow-x` / `-y`). */
  grow?: boolean
  /** Layout only: its thickness and place (`h-2`, `w-full`). */
  className?: string
  /** For the entrance's order (`--i`) or an opacity. */
  style?: CSSProperties
}) {
  const size = `max(${min}px, ${Math.min(Math.max(share, 0), 1) * 100}%)`
  const bar = (
    <span
      aria-hidden="true"
      className={`block rounded-(--bar-radius) ${color ? '' : TONES[tone]} ${grow ? (axis === 'x' ? 'enter-grow-x' : 'enter-grow-y') : ''} ${track ? (axis === 'x' ? 'h-full' : 'w-full') : className}`}
      style={{ ...(color ? { backgroundColor: color } : {}), [axis === 'x' ? 'width' : 'height']: size, ...style }}
    />
  )
  if (!track) return bar
  return (
    <span aria-hidden="true" className={`block overflow-hidden rounded-(--bar-radius) bg-ink/[0.08] ${className}`}>
      {bar}
    </span>
  )
}
