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
}

export type UnifiedAchievement = RaAchievementUnified | SteamAchievementUnified
