/**
 * Steam Web API response shapes, plus the unified game/achievement model the
 * UI renders once RA and Steam feeds are mixed.
 *
 * Steam wraps almost everything in `response` or `playerstats` and uses
 * snake_case; these types mirror the wire format exactly so the mapping to the
 * unified model happens in one place instead of being spread across routes.
 */

/* ---------- Wire format ---------- */

export type SteamPlayerSummary = {
  steamid: string
  personaname: string
  avatarfull?: string
  profileurl?: string
  realname?: string
  loccountrycode?: string
  /** Present only while the player is in a game. */
  gameextrainfo?: string
  gameid?: string
  /** Account creation, unix seconds — only on public profiles. */
  timecreated?: number
  /** 0 offline, 1 online, 2 busy, 3 away, 4 snooze, 5 looking to trade, 6 looking to play. */
  personastate?: number
}

/** What /api/steam/profile returns: the summary plus the Steam level. */
export type SteamProfile = SteamPlayerSummary & { level: number | null }

/** One recent unlock across the player's games, as the profile column lists them. */
export type SteamRecentAchievement = {
  appId: number
  gameTitle: string
  apiname: string
  title: string
  badgeUrl: string
  /** ISO time of the unlock. */
  unlockedAt: string
  /**
   * Share of all Steam players who have it, 0–100; null when Steam gives no
   * rarity. Absent on lists cached before rarity was added.
   */
  globalPct?: number | null
}

export type SteamPlayerSummariesResponse = {
  response: { players: SteamPlayerSummary[] }
}

export type SteamOwnedGame = {
  appid: number
  name?: string
  playtime_forever: number
  playtime_2weeks?: number
  img_icon_url?: string
  img_logo_url?: string
  /** False means the game exposes no achievements — treat it as having none. */
  has_community_visible_stats?: boolean
  /** Only GetOwnedGames returns this — GetRecentlyPlayedGames does not. */
  rtime_last_played?: number
}

export type SteamOwnedGamesResponse = {
  response: { game_count?: number; games?: SteamOwnedGame[] }
}

export type SteamRecentlyPlayedResponse = {
  response: { total_count?: number; games?: SteamOwnedGame[] }
}

export type SteamPlayerAchievement = {
  apiname: string
  /** 1 or 0 — Steam has no hardcore/softcore distinction. */
  achieved: 0 | 1
  unlocktime: number
  name?: string
  description?: string
}

export type SteamPlayerAchievementsResponse = {
  playerstats: {
    steamID?: string
    gameName?: string
    achievements?: SteamPlayerAchievement[]
    success: boolean
    /** Set when the profile is private or the game has no stats. */
    error?: string
  }
}

export type SteamSchemaAchievement = {
  name: string
  defaultvalue: number
  displayName: string
  hidden: 0 | 1
  description?: string
  icon: string
  icongray: string
}

export type SteamGlobalPercentagesResponse = {
  achievementpercentages?: {
    /** percent arrives as a string ("83.3") from the live API. */
    achievements?: { name: string; percent: string | number }[]
  }
}

export type SteamStoreData = {
  name: string
  type?: string
  developers?: string[]
  publishers?: string[]
  genres?: { id?: string; description: string }[]
  release_date?: { coming_soon: boolean; date: string }
  short_description?: string
  header_image?: string
  screenshots?: { id: number; path_thumbnail: string; path_full: string }[]
  /** Game modes (multi-player, online co-op…); ids are stable, descriptions localised. */
  categories?: { id: number | string; description: string }[]
}

/** Store appdetails is keyed by appid: { "377160": { success, data } }. */
export type SteamAppDetailsResponse = Record<string, { success: boolean; data?: SteamStoreData }>

/** What /api/steam/gameDetails returns: store data, flattened and trimmed. */
export type SteamGameDetails = {
  appId: number
  name: string
  developers: string[]
  publishers: string[]
  genres: string[]
  releaseDate: string | null
  description: string | null
  screenshots: { thumb: string; full: string }[]
}

export type SteamSchemaResponse = {
  game?: {
    gameName?: string
    availableGameStats?: { achievements?: SteamSchemaAchievement[] }
  }
}

/* ---------- Unified model ---------- */

export type GameSource = 'ra' | 'steam'

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

export type RaGameProgress = GameProgressBase & {
  _source: 'ra'
  hardcoreMode: boolean
  numAwardedHardcore: number
  pointsTotal: number
  pointsEarned: number
  consoleId: number
}

export type SteamGameProgress = GameProgressBase & {
  _source: 'steam'
  /** Minutes, as Steam reports them. RA has no equivalent. */
  playtimeForever: number
  playtime2Weeks: number
  imgLogoUrl: string
  hasStats: boolean
  /**
   * Whether maxPossible/numAwarded are real. Counts cost one API call per game,
   * so only a bounded set is filled in; without this flag an unloaded game and
   * a game with no achievements would both look like 0/0.
   */
  achievementsLoaded: boolean
}

export type UnifiedGame = RaGameProgress | SteamGameProgress

export type AchievementBase = {
  _source: GameSource
  id: string | number
  title: string
  description: string
  dateEarned: string | null
  badgeUrl: string
  displayOrder: number
}

export type RaAchievementUnified = AchievementBase & {
  _source: 'ra'
  points: number
  trueRatio: number
  type: 'progression' | 'win_condition' | 'missable' | null
  dateEarnedHardcore: string | null
}

export type SteamAchievementUnified = AchievementBase & {
  _source: 'steam'
  apiname: string
  hidden: boolean
  /**
   * Unlocked or not. Not derivable from dateEarned: achievements unlocked before
   * Steam kept timestamps come back achieved with unlocktime 0, so no date.
   */
  earned: boolean
  /** Share of all Steam players who have it, 0–100 — Steam's equivalent of RA rarity. */
  globalPct: number | null
  /** Probably needs online play — guessed from its description, Steam has no such flag. */
  likelyOnline: boolean
}

export type UnifiedAchievement = RaAchievementUnified | SteamAchievementUnified
