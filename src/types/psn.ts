import type { GameProgressBase } from '@/types/steam'

/**
 * Trophies by grade. psn-api types platinum as 0 | 1, which holds for one
 * game but not for a profile's total, so this is plain numbers.
 */
export type TrophyCounts = Record<'bronze' | 'silver' | 'gold' | 'platinum', number>

export type TrophyGrade = keyof TrophyCounts

/**
 * A game in a PSN trophy list, in the unified model so the shared cards take
 * it like an RA or Steam game. `id` is the trophy set's number (see
 * psnNumericId); `titleId` keeps Sony's own form for calls and URLs.
 * `pctWon` is Sony's progress, which weighs trophies by grade — for a game
 * with DLC, the base game's (see `full` for the whole set).
 *
 * `lastPlayed` is the last session when Sony reports one (PS4/PS5 games), and
 * otherwise the last trophy. The play fields are null for PS3/Vita games and
 * when the player hides their gaming history.
 */
export type PsnGameProgress = GameProgressBase & {
  _source: 'psn'
  /** npCommunicationId, e.g. "NPWR20188_00". */
  titleId: string
  /** "trophy2" for PS5, "trophy" for PS3/PS4/Vita; the trophy calls need it. */
  service: 'trophy' | 'trophy2'
  /** For a game with DLC, the base game's; `full` has the whole set. */
  earned: TrophyCounts
  defined: TrophyCounts
  /** The game has DLC trophy groups; its main numbers are the base game's. */
  hasDlc: boolean
  /** The whole set, base game and DLC, as Sony counts it. */
  full: { earned: TrophyCounts; defined: TrophyCounts; pctWon: number }
  /** When the trophy list last changed (ISO) — what the trophy caches key on. */
  lastTrophyAt: string | null
  playtimeMinutes: number | null
  /**
   * The played games the play data came from ("CUSA01106_00"…). A collection
   * is one played game behind several trophy lists, so totals count each once.
   */
  playedAs: string[]
  /** Times the game was started. */
  playCount: number | null
  /** Store box art, portrait. */
  coverUrl: string | null
  /** Wide store artwork, for backdrops. */
  heroUrl: string | null
  /** The game's PlayStation Store concept, where its release date is read from. Null for PS3/Vita. */
  conceptId: number | null
}

/** One trophy of a game, with whether and when the account earned it. */
export type PsnTrophy = {
  id: number
  name: string
  detail: string
  iconUrl: string | null
  type: TrophyGrade
  /** "default" for the base game, "001"… for each DLC. */
  groupId: string
  hidden: boolean
  earned: boolean
  earnedAt: string | null
  /** Share of PSN players who have it, 0–100; null when Sony does not say. */
  rarity: number | null
}

/** A game's trophy group: the base game ("default") or a DLC, with what the account has of it. */
export type PsnTrophyGroup = {
  id: string
  name: string
  iconUrl: string | null
  defined: TrophyCounts
  earned: TrophyCounts
  /** 0–100, Sony's. */
  progress: number
}

/** A trophy earned, with its game — the PSN side of the recent-unlocks feeds. */
export type PsnRecentTrophy = {
  /** The game's numeric id (psnNumericId). */
  gameId: number
  titleId: string
  gameTitle: string
  gameIconUrl: string
  trophyId: number
  name: string
  iconUrl: string | null
  type: TrophyGrade
  /** ISO time it was earned. */
  earnedAt: string
  rarity: number | null
}
