import type { PsnGameProgress, TrophyCounts } from '@/types/psn'

export type PsnCategory = 'wantToPlay' | 'playing' | 'completed'

const TITLE_ID = /^NPWR(\d{5})_(\d{2})$/

/**
 * Sony's trophy-set ID as a number, so a PSN game fits wherever the app keys
 * games by (source, number) — pins, groups, hidden games. Always "NPWR",
 * five digits, "_", two digits, so the digits alone say it all:
 * "NPWR20188_00" → 2018800. Null for anything else.
 */
export function psnNumericId(titleId: string): number | null {
  const m = TITLE_ID.exec(titleId)
  return m ? Number(m[1]) * 100 + Number(m[2]) : null
}

/** The other way: 2018800 → "NPWR20188_00". */
export function psnTitleId(id: number): string {
  return `NPWR${String(Math.floor(id / 100)).padStart(5, '0')}_${String(id % 100).padStart(2, '0')}`
}

export function isPsnTitleId(value: string): boolean {
  return TITLE_ID.test(value)
}

/**
 * Where a PSN game goes among the category pages: completed at 100% (the base
 * game, for one with DLC), in progress with something earned, and "no
 * achievements" when it was launched but nothing earned yet.
 */
export function classifyPsnGame(game: Pick<PsnGameProgress, 'pctWon'>): PsnCategory {
  if (game.pctWon >= 100) return 'completed'
  if (game.pctWon > 0) return 'playing'
  return 'wantToPlay'
}

export function countTrophies(counts: TrophyCounts): number {
  return counts.bronze + counts.silver + counts.gold + counts.platinum
}

/** The grades best first, as PlayStation lists them. */
export const TROPHY_GRADES = ['platinum', 'gold', 'silver', 'bronze'] as const

/** Text colour per grade. Always shown with the grade's name, never as the only cue. */
export const TROPHY_GRADE_COLOR: Record<(typeof TROPHY_GRADES)[number], string> = {
  platinum: 'text-sky-300',
  gold: 'text-yellow-400',
  silver: 'text-zinc-400',
  bronze: 'text-orange-400',
}

/** The widest art there is for a game's backdrop: store hero art, then box art, then the trophy icon. */
export function psnBackdrop(game: Pick<PsnGameProgress, 'heroUrl' | 'coverUrl' | 'imageIcon'>): string {
  return game.heroUrl ?? game.coverUrl ?? game.imageIcon
}

/** Sony's platform codes as people write them: "PSVITA" → "PS Vita", and a cross-buy list "PS3,PSVITA" → "PS3 · PS Vita". */
export function psnPlatformName(raw: string): string {
  return raw
    .split(',')
    .map((p) => (p.trim().toUpperCase() === 'PSVITA' ? 'PS Vita' : p.trim()))
    .join(' · ')
}

/**
 * The platform chip's colours, after each console: PS5 white, PS4 the
 * PlayStation blue, PS3 piano black, Vita light blue. A cross-buy list takes
 * its first platform's. The name is always written in the chip too, so the
 * colour is never the only cue.
 */
export function psnPlatformChip(consoleName: string): string {
  const first = consoleName.split('·')[0].trim().toUpperCase()
  if (first === 'PS5') return 'bg-zinc-100 text-zinc-900'
  if (first === 'PS3') return 'bg-black text-zinc-100 ring-1 ring-zinc-500'
  if (first.includes('VITA')) return 'bg-sky-300 text-sky-950'
  return 'bg-[#003791] text-white'
}

/** The id a trophy's row carries on its game page, so a link can jump to it. */
export function psnTrophyAnchor(trophyId: number): string {
  return `trophy-${trophyId}`
}

/**
 * Total play time across a library. A collection's time is on each of its
 * trophy lists (Sony does not split it), so games fed by the same played
 * games count once.
 */
export function totalPlaytime(games: Pick<PsnGameProgress, 'playtimeMinutes' | 'playedAs'>[]): number {
  const seen = new Set<string>()
  let minutes = 0
  for (const g of games) {
    if (g.playtimeMinutes === null) continue
    const key = g.playedAs.join(',')
    if (key && seen.has(key)) continue
    seen.add(key)
    minutes += g.playtimeMinutes
  }
  return minutes
}

/** The base game's group; every other group is a DLC. */
export const BASE_GROUP = 'default'

/**
 * Trophies split by group, in the groups' order (base game first). With one
 * group, or no groups known, it is one section.
 */
export function trophiesByGroup<T extends { groupId: string }>(
  trophies: T[],
  groups: { id: string }[],
): { groupId: string; trophies: T[] }[] {
  if (groups.length <= 1) return [{ groupId: BASE_GROUP, trophies }]
  return groups
    .map((g) => ({ groupId: g.id, trophies: trophies.filter((t) => t.groupId === g.id) }))
    .filter((s) => s.trophies.length > 0)
}
