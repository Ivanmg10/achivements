/** An Xbox Live profile, as the admin explorer shows it. */
export type XboxProfile = {
  /** Xbox's account number, a long decimal string (too big for a JS number). */
  xuid: string
  gamertag: string
  avatarUrl: string | null
  gamerscore: number
  /** "Gold", "Silver"… */
  tier: string
}

/**
 * A game in an Xbox library. Xbox scores in gamerscore, not trophy grades, and
 * has no DLC groups: DLC achievements sit inside their game.
 */
export type XboxGame = {
  /** Xbox's title id, kept as the decimal string Xbox sends. */
  titleId: string
  name: string
  imageUrl: string | null
  /** "Xbox Series", "Xbox One", "Xbox 360", "PC" — each once. */
  platforms: string[]
  /** Xbox 360 games have their own achievements endpoint and shape. */
  is360: boolean
  earnedAchievements: number
  /** Null when Xbox does not say: newer games often report 0 here while their gamerscore total is real. */
  totalAchievements: number | null
  earnedGamerscore: number
  totalGamerscore: number
  /** 0–100, by gamerscore. */
  progress: number
  lastPlayed: string | null
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
