import type { GameProgressBase } from '@/types/steam'

/** An Xbox Live profile, as the app shows it. */
export type XboxProfile = {
  /** Xbox's account number, a long decimal string (too big for a JS number). */
  xuid: string
  gamertag: string
  avatarUrl: string | null
  bio: string
  gamerscore: number
  /** "Gold", "Silver"… */
  tier: string
}

/**
 * A game in an Xbox library, in the unified game model so the shared cards take
 * it like an RA, Steam or PSN game. `id` is Xbox's title id as a number (see
 * xboxNumericId); `titleId` keeps the decimal string Xbox sends, for calls.
 *
 * Xbox scores in gamerscore, not trophy grades, and has no DLC groups: DLC
 * achievements sit inside their game. `pctWon` is by gamerscore.
 */
export type XboxGameProgress = GameProgressBase & {
  _source: 'xbox'
  titleId: string
  /** "Xbox Series", "Xbox One", "Xbox 360", "PC" — each once. */
  platforms: string[]
  /** Xbox 360 games have their own achievements endpoint and shape. */
  is360: boolean
  /**
   * Whether `maxPossible` is real. Newer games report 0 achievements while
   * their gamerscore total is right, so without this flag an unknown total and a
   * game with no achievements would both look like 0 (the same trap as Steam's
   * achievementsLoaded). Progress and gamerscore are always real.
   */
  totalKnown: boolean
  earnedGamerscore: number
  totalGamerscore: number
  /** Minutes played, when known. Not read yet: Xbox sends it in a separate call. */
  playtimeMinutes: number | null
}

export type XboxAchievement = {
  id: string
  name: string
  description: string
  iconUrl: string | null
  gamerscore: number
  unlocked: boolean
  unlockedAt: string | null
  /** Hidden until earned, as the game's author set it. */
  secret: boolean
  /** Share of players who have it, 0–100; null when Xbox does not say. */
  rarity: number | null
  /** "Common", "Rare"… as Xbox words it. */
  rarityCategory: string | null
}

/** An achievement earned, with its game — the Xbox side of the recent-unlocks feeds. */
export type XboxRecentAchievement = {
  /** The game's numeric id (xboxNumericId). */
  gameId: number
  titleId: string
  gameTitle: string
  gameIconUrl: string
  achievementId: string
  name: string
  iconUrl: string | null
  gamerscore: number
  /** ISO time it was earned. */
  earnedAt: string
  rarity: number | null
}

/** The headline numbers for one account. */
export type XboxSummary = {
  gamertag: string
  avatarUrl: string | null
  bio: string
  tier: string
  gamerscore: number
  /** Achievements unlocked across the whole library. */
  achievementsUnlocked: number
  games: number
}
