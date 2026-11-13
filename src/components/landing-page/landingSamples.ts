import { steamAssetUrl } from '@/lib/steamAssets'
import type { GameSource } from '@/types/game'
import type { Streak } from '@/types/types'
import { addDays } from '@/utils/dates'

/**
 * What the landing shows of the app, always under an "Example" label: the figures are the owner's own
 * (games, groups, streaks and Vault Points from the captures of 2026-11-07, canvas page 4), the covers come
 * from the art wall's pool or IGDB, and where neither has art for one of the owner's games or groups, a game it
 * has stands in. No Xbox, and nobody else's data.
 */

export type SampleGame = {
  title: string
  source: GameSource
  /** The console it is played on, where the platform has more than one. */
  console?: string
  cover: string
  /** The art behind its row; the cover when none. */
  art?: string
  /** A Steam example's app: its row opens on its achievements (`sample-library/`). */
  appId?: number
  /** A PSN example's trophy set: its row opens on its trophies (`sample-library/`). */
  trophySet?: string
  /** An RA example's game: its row opens on its achievements (`sample-library/`). */
  raId?: number
  earned: number
  total: number
  hours?: number
  /** Hours in the last two weeks, for an opened Steam example (its last unlocks are days old). */
  recentHours?: number
}

const RA_ART = 'https://media.retroachievements.org/Images'

export const SAMPLE_GAMES: SampleGame[] = [
  { title: 'Fallout 4', source: 'steam', appId: 377160, cover: steamAssetUrl(377160, 'cover'), art: steamAssetUrl(377160, 'header'), earned: 52, total: 84, hours: 120, recentHours: 6 },
  { title: "Assassin's Creed Brotherhood", source: 'psn', console: 'PS4', trophySet: 'NPWR11436_00', cover: steamAssetUrl(48190, 'cover'), art: steamAssetUrl(48190, 'header'), earned: 51, total: 51, hours: 82 },
  { title: 'Pokémon Gold Version', source: 'ra', console: 'Game Boy Color', raId: 576, cover: `${RA_ART}/105481.png`, earned: 25, total: 72 },
  { title: 'Call of Duty: Black Ops II', source: 'steam', appId: 202970, cover: steamAssetUrl(202970, 'cover'), art: steamAssetUrl(202970, 'header'), earned: 16, total: 35, hours: 30 },
  { title: 'Inazuma Eleven: Victory Road', source: 'steam', appId: 2799860, cover: steamAssetUrl(2799860, 'cover'), art: steamAssetUrl(2799860, 'header'), earned: 52, total: 52, hours: 61, recentHours: 4 },
  { title: 'Super Mario Sunshine', source: 'ra', console: 'GameCube', raId: 6049, cover: `${RA_ART}/081263.png`, earned: 19, total: 148 },
]

export type SampleGroup = {
  /** The group's name, or the key of one in `T.landing` (a name in the reader's language). */
  name: string
  named?: 'sampleGroupNovember'
  /** Its games' covers, the band split between them as a real group's card does. */
  covers: string[]
  games: number
  earned: number
  total: number
}

/** A box from IGDB at twice its card size (528 × 704), by its image id (IGDB's `cover.image_id`). */
const igdbCover = (imageId: string) => `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`
const steamCovers = (...ids: number[]) => ids.map((id) => steamAssetUrl(id, 'cover'))

export const SAMPLE_GROUPS: SampleGroup[] = [
  // Assassin's Creed 2, Brotherhood, Origins, Unity.
  { name: "Assassin's Creed", covers: steamCovers(33230, 48190, 582160, 289650), games: 4, earned: 141, total: 176 },
  // MediEvil (PS1), Dragon Ball Z: Budokai 3 (PS2) and Skate 3 (PS3): their boxes from IGDB, the project's source of covers
  // (images.igdb.com, an allowed host); Marvel's Spider-Man by its Steam art, the PS4 game's own.
  {
    name: 'Juegos noviembre',
    named: 'sampleGroupNovember',
    covers: [igdbCover('co1tjk'), igdbCover('co6dfo'), steamAssetUrl(1817070, 'cover'), igdbCover('co1o4l')],
    games: 4,
    earned: 77,
    total: 112,
  },
  // Ruby, Gold, Platinum, Colosseum: their boxes from IGDB (RetroAchievements' are 96 px squares, blurred in a tall slice).
  { name: 'Pokémon', covers: ['co1zhq', 'co5pia', 'co8gvp', 'co2tpe'].map(igdbCover), games: 21, earned: 489, total: 2522 },
]

const streak = (start: string, end: string, days: number): Streak => ({ start, end, days, achievements: [] })

/** The best streaks, longest first; the first one is the one going on. */
export const SAMPLE_STREAKS: Streak[] = [
  streak('2026-09-08', '2026-11-02', 56),
  streak('2026-05-02', '2026-06-05', 35),
  streak('2026-02-27', '2026-03-14', 16),
  streak('2026-06-17', '2026-06-30', 14),
  streak('2026-02-14', '2026-02-25', 12),
  streak('2026-04-13', '2026-04-24', 12),
]

/** The same streaks moved so the one going on ends on `today` ("YYYY-MM-DD"): an example that never goes stale. */
export function streaksEndingOn(today: string): Streak[] {
  const shift = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${SAMPLE_STREAKS[0].end}T00:00:00Z`)) / 864e5)
  return SAMPLE_STREAKS.map((s) => ({ ...s, start: addDays(s.start, shift), end: addDays(s.end, shift) }))
}

/** Vault Points by platform. */
export const SAMPLE_POINTS: Partial<Record<GameSource, number>> = { ra: 27901, steam: 64094, psn: 22853 }

const BO2_ICONS = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/202970'

/** Call of Duty: Black Ops II on Steam as a game page's example, with the owner's count (16 of 35). */
export const SAMPLE_GAME_PAGE = { title: 'Call of Duty: Black Ops II', source: 'steam' as const, appId: 202970, earned: 16, total: 35 }

/**
 * Six of its achievements, three earned and three to get: their icons and Steam's global rarity (read once,
 * 2026-11-13). Their names and texts are Steam's own, per language, in `T.landing.sampleAchievements` in this
 * order. An earned one is dated `daysAgo` days before the day the page is shown, so the example never ages.
 */
export const SAMPLE_ACHIEVEMENTS: { icon: string; rarity: number; daysAgo: number | null }[] = [
  { icon: `${BO2_ICONS}/0133fda3a5fa19b1165259600644d25d981bf479.jpg`, rarity: 53.3, daysAgo: 64 },
  { icon: `${BO2_ICONS}/ab8d4ccecae718e5314300a6716d0c3623ce0dc5.jpg`, rarity: 52.7, daysAgo: 63 },
  { icon: `${BO2_ICONS}/910637c7094876116abbb2e786652120fb4f65f3.jpg`, rarity: 41.2, daysAgo: 41 },
  { icon: `${BO2_ICONS}/9dfd28b4500bdc6a148469ad3576fca079768bc8.jpg`, rarity: 6.4, daysAgo: null },
  { icon: `${BO2_ICONS}/f6699b8c585d8e0f74d946382dc9a6b944668e1d.jpg`, rarity: 5.5, daysAgo: null },
  { icon: `${BO2_ICONS}/dc92dcfcab652a8d51315a3e9abc8a2b87db664f.jpg`, rarity: 3.4, daysAgo: null },
]

export type RankPeriod = 'all' | 'month' | 'week'

/**
 * Where the example player stands in the rankings, by period: the place of the first row shown and four rows'
 * points, the player's second. Nobody else is named, real or made up.
 */
export const SAMPLE_RANKS: Record<RankPeriod, { first: number; points: number[] }> = {
  all: { first: 11, points: [120412, 114848, 111603, 107125] },
  month: { first: 26, points: [9840, 9302, 9015, 8771] },
  week: { first: 40, points: [2718, 2527, 2490, 2302] },
}
