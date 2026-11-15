/** The types every platform shares. Each platform's own shapes stay in its file (steam.ts, psn.ts, xbox.ts, types.ts). */

export type GameSource = 'ra' | 'steam' | 'psn' | 'xbox'

/** Where a game sits in a library: the list it goes in on every platform. */
export type GameStatus = 'wantToPlay' | 'playing' | 'completed'

/** A favourite game as it is kept on the account (users.favorite_*_game) and travels in the session. */
export type SavedGame = { id: number; title: string; imageIcon: string } | null

/** A game of any platform with the user's progress, as the Steam, PSN and Xbox libraries carry it. */
export type GameProgressBase = {
  _source: GameSource
  id: number
  title: string
  imageIcon: string
  consoleName: string
  maxPossible: number
  numAwarded: number
  pctWon: number
  lastPlayed: string | null
}

/** One achievement or trophy of any platform, as someone has it: what every cross-platform view starts from. */
export type GameAchievement = {
  id: string
  title: string
  description: string
  iconUrl: string | null
  /** Share of players who have it, 0–100; null when the platform does not say. */
  rarity: number | null
  earned: boolean
  /** Null for an unlock with no date. */
  earnedAt: string | null
}
