import { steamAssetUrl } from '@/lib/steamAssets'
import type { GameSource } from '@/types/game'
import type { Streak } from '@/types/types'

/**
 * What the landing shows of the app, always under an "Example" label: the figures are the owner's own
 * (games, groups, streaks and Vault Points from the captures of 2026-11-07, canvas page 4), the covers come
 * from the art wall's pool, and where the pool has no art for one of the owner's games or groups, a game it
 * has stands in. No Xbox, and nobody else's data.
 */

export type SampleGame = {
  title: string
  source: GameSource
  /** The console it is played on, where the platform has more than one. */
  console?: string
  cover: string
  earned: number
  total: number
  hours?: number
}

const RA_ART = 'https://media.retroachievements.org/Images'

export const SAMPLE_GAMES: SampleGame[] = [
  { title: 'Fallout 4', source: 'steam', cover: steamAssetUrl(377160, 'cover'), earned: 52, total: 84, hours: 120 },
  { title: "Assassin's Creed Brotherhood", source: 'psn', console: 'PS4', cover: steamAssetUrl(48190, 'cover'), earned: 51, total: 51, hours: 82 },
  { title: 'Pokémon Gold Version', source: 'ra', console: 'Game Boy Color', cover: `${RA_ART}/105481.png`, earned: 17, total: 49 },
  { title: 'Call of Duty: Black Ops II', source: 'steam', cover: steamAssetUrl(202970, 'cover'), earned: 16, total: 35, hours: 30 },
  { title: 'Inazuma Eleven: Victory Road', source: 'steam', cover: steamAssetUrl(2799860, 'cover'), earned: 52, total: 52, hours: 61 },
  { title: 'Super Mario Sunshine', source: 'ra', console: 'GameCube', cover: `${RA_ART}/081263.png`, earned: 9, total: 70 },
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

const steamCovers = (...ids: number[]) => ids.map((id) => steamAssetUrl(id, 'cover'))

export const SAMPLE_GROUPS: SampleGroup[] = [
  // Assassin's Creed 2, Brotherhood, Origins, Unity.
  { name: "Assassin's Creed", covers: steamCovers(33230, 48190, 582160, 289650), games: 4, earned: 141, total: 176 },
  // MediEvil and Dragon Ball Z (RetroAchievements' boxes), Marvel's Spider-Man (its Steam art, the PS4 game's own), and for
  // Skate 3 (Xbox 360 and PS3 only, no picture on an allowed host) its sequel on Steam, skate.
  {
    name: 'Juegos noviembre',
    named: 'sampleGroupNovember',
    covers: [`${RA_ART}/114756.png`, `${RA_ART}/103756.png`, steamAssetUrl(1817070, 'cover'), steamAssetUrl(3354750, 'hero')],
    games: 4,
    earned: 77,
    total: 112,
  },
  // Ruby, Gold, Platinum, Colosseum: RetroAchievements' boxes, drawn no bigger than twice their size.
  { name: 'Pokémon', covers: [`${RA_ART}/104260.png`, `${RA_ART}/105481.png`, `${RA_ART}/104787.png`, `${RA_ART}/068145.png`], games: 21, earned: 489, total: 2522 },
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

/** Vault Points by platform. */
export const SAMPLE_POINTS: Partial<Record<GameSource, number>> = { ra: 27901, steam: 64094, psn: 22853 }
