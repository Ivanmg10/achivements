/** How long the line takes to draw itself across. recharts' 1.5 s left the dots alone on screen for most of it. */
export const DRAW_MS = 600

/**
 * When a point's dot appears: as the line reaches it. recharts draws the dots in a layer of their own, outside
 * the clip that reveals the line, so left alone they were all there at once, a second and a half before it (#128).
 */
export function dotDelay(index: number, count: number): number {
  return count > 1 ? Math.round((index / (count - 1)) * DRAW_MS) : 0
}
