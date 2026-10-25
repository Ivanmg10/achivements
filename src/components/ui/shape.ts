import type { CSSProperties } from 'react'

/** The slants a bar's ends can have, in px (see `--clip-*` in globals.css). */
export type SlantPx = 3 | 4 | 5 | 6 | 8 | 14

/**
 * The cut ends of a bar, a step or a segment: slanted by `px` in the slanted
 * design, straight and rounded in the round one. Read from the design's tokens
 * (`--clip-*`, `--bar-radius`), so the choice never reaches the component.
 */
export const slantStyle = (px: SlantPx): CSSProperties => ({ clipPath: `var(--clip-${px})`, borderRadius: 'var(--bar-radius)' })
