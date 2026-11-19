/**
 * The shape of an RA box art by console, width over height, measured on the owner's library (2026-11-19): what
 * the hero's cover holds until the picture's own size is known, so RA's box does not jump when it loads.
 * A console not here holds a PS2 or GameCube box, the most common shape.
 */
const RATIOS: Record<string, number> = {
  'Nintendo DS': 1.11,
  'Nintendo DSi': 1.11,
  'Game Boy Advance': 1,
  PlayStation: 1,
  Dreamcast: 1,
  'PlayStation Portable': 0.57,
}

const DEFAULT = 0.71

export function raBoxRatio(consoleName: string | null | undefined): number {
  return (consoleName && RATIOS[consoleName]) || DEFAULT
}
