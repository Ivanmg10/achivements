/** Which edges of a strip have more of it past them: left and right, or top and bottom (`axis` y). */
export type ScrollEdges = { start: boolean; end: boolean }

// The content melts into whatever is behind it (a mask, not a painted gradient), so it works on any ground.
const FADES = {
  none: '',
  end: '[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]',
  start: '[mask-image:linear-gradient(to_left,black_calc(100%-2.5rem),transparent)]',
  both: '[mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]',
}
const FADES_Y = {
  none: '',
  end: '[mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]',
  start: '[mask-image:linear-gradient(to_top,black_calc(100%-2.5rem),transparent)]',
  both: '[mask-image:linear-gradient(to_bottom,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]',
}

/**
 * The fade on the edge of a strip that scrolls sideways (or down, `axis` y), there only while more of it is past that
 * edge (#134: tabs cut at the screen's edge said nothing). `useScrollFade` keeps the edges and gives
 * this class; use it directly only for a strip whose edges are known another way.
 */
export function scrollFadeClass({ start, end }: ScrollEdges, axis: 'x' | 'y' = 'x'): string {
  return (axis === 'y' ? FADES_Y : FADES)[start && end ? 'both' : start ? 'start' : end ? 'end' : 'none']
}
