/**
 * The shape a game page's cover holds until its picture's size is known (#167, #203), width over height, so the
 * box does not jump when the picture loads. Measured on the owner's games (2026-11-19 and -20).
 */

/** Steam's `library_600x900` and Sony's Store portrait (1440×2160). */
export const PORTRAIT = 2 / 3

/** IGDB's covers (528×704 at `t_cover_big_2x`): Xbox's box art and a PS4/PS5 game's with no Store cover. */
export const IGDB_COVER = 3 / 4

/** RA's box art by console. A console not here holds a PS2 or GameCube box, the most common shape. */
const RA_RATIOS: Record<string, number> = {
  'Nintendo DS': 1.11,
  'Nintendo DSi': 1.11,
  'Game Boy Advance': 1,
  PlayStation: 1,
  Dreamcast: 1,
  'PlayStation Portable': 0.57,
}

const RA_DEFAULT = 0.71

export function raBoxRatio(consoleName: string | null | undefined): number {
  return (consoleName && RA_RATIOS[consoleName]) || RA_DEFAULT
}
