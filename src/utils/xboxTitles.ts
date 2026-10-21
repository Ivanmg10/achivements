import type { XboxGameProgress } from '@/types/xbox'

/** The largest id the INTEGER game_id columns hold. */
const MAX_ID = 2_147_483_647

/**
 * Xbox's title id as a number, so an Xbox game fits wherever the app keys games
 * by (source, number) — pins, groups, hidden games. Xbox's ids are decimal
 * already ("1738914043"), unlike PSN's. Null for anything else, and for the
 * rare id past what the columns hold (the largest seen is under that).
 */
export function xboxNumericId(titleId: string): number | null {
  if (!/^\d{1,10}$/.test(titleId)) return null
  const id = Number(titleId)
  return id > 0 && id <= MAX_ID ? id : null
}

/** The other way: 1738914043 → "1738914043". */
export function xboxTitleId(id: number): string {
  return String(id)
}

export function isXboxTitleId(value: string): boolean {
  return xboxNumericId(value) !== null
}

export type XboxCategory = 'wantToPlay' | 'playing' | 'completed'

/**
 * Where an Xbox game goes among the category pages: completed at 100 % of its
 * gamerscore, in progress with something earned, and "no achievements" when it
 * was launched but nothing earned yet.
 */
export function classifyXboxGame(game: Pick<XboxGameProgress, 'pctWon'>): XboxCategory {
  if (game.pctWon >= 100) return 'completed'
  if (game.pctWon > 0) return 'playing'
  return 'wantToPlay'
}

/** Whether the game has any achievements at all (its gamerscore total says so even when its count does not). */
export function xboxHasAchievements(game: Pick<XboxGameProgress, 'totalGamerscore' | 'maxPossible'>): boolean {
  return game.totalGamerscore > 0 || game.maxPossible > 0
}

/** The id a game's achievement row carries on its game page, so a link can jump to it. */
export function xboxAchievementAnchor(achievementId: string): string {
  return `achievement-${achievementId}`
}

/** The platform chip's colours: Series white, One green, 360 dark, PC blue. Always written in the chip too, so colour is never the only cue. */
export function xboxPlatformChip(consoleName: string): string {
  const first = consoleName.split('·')[0].trim()
  if (first === 'Xbox Series') return 'bg-zinc-100 text-zinc-900'
  if (first === 'Xbox One') return 'bg-[#107c10] text-white'
  if (first === 'Xbox 360') return 'bg-black text-zinc-100 ring-1 ring-zinc-500'
  return 'bg-sky-300 text-sky-950'
}

/** The widest art there is for a game's backdrop: its box art (Xbox sends no wide art). */
export function xboxBackdrop(game: Pick<XboxGameProgress, 'imageIcon'>): string {
  return game.imageIcon
}

/** Total play time across a library, in minutes; games Xbox gave none for count as none. */
export function totalXboxPlaytime(games: Pick<XboxGameProgress, 'playtimeMinutes'>[]): number {
  return games.reduce((sum, g) => sum + (g.playtimeMinutes ?? 0), 0)
}

/** Total gamerscore across a library. */
export function totalGamerscore(games: Pick<XboxGameProgress, 'earnedGamerscore'>[]): number {
  return games.reduce((sum, g) => sum + g.earnedGamerscore, 0)
}

const nameKey = (g: XboxGameProgress) => g.title.trim().toLowerCase()

/**
 * Xbox lists some games twice under one name: the game, and a title with no
 * achievements that launches it (measured 2026-10-21: "Minecraft: Xbox 360
 * Edition" is 1480659447 with 93 achievements, and 1297287809, 0x4D53…, with
 * none, played seconds apart). The empty twin is dropped; its last session and
 * play time go to the game. A game without achievements that has no such twin stays.
 */
export function foldTwinTitles(games: XboxGameProgress[]): XboxGameProgress[] {
  const real = new Map<string, XboxGameProgress>()
  for (const g of games) if (xboxHasAchievements(g) && !real.has(nameKey(g))) real.set(nameKey(g), { ...g })

  const out: XboxGameProgress[] = []
  for (const g of games) {
    const game = real.get(nameKey(g))
    if (!game) out.push(g)
    else if (xboxHasAchievements(g)) out.push(game.titleId === g.titleId ? game : g)
    else {
      if (g.lastPlayed && (!game.lastPlayed || g.lastPlayed > game.lastPlayed)) game.lastPlayed = g.lastPlayed
      if (game.playtimeMinutes == null && g.playtimeMinutes != null) game.playtimeMinutes = g.playtimeMinutes
    }
  }
  return out
}
