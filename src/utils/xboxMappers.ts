import { xboxNumericId } from '@/utils/xboxTitles'
import type { RecentAchievement } from '@/types/types'
import type { XboxAchievement, XboxGameProgress, XboxProfile, XboxRecentAchievement } from '@/types/xbox'

/** The console slot for Xbox rows in the unified model. */
export const XBOX_PLATFORM = 'Xbox'

/** The parts of OpenXBL's answers the app reads. Everything else is ignored. */
export type RawProfileUser = { id: string; settings?: Array<{ id: string; value: string }> }
export type RawTitle = {
  titleId: string
  name: string
  displayImage?: string | null
  devices?: string[]
  achievement?: {
    currentAchievements?: number
    totalAchievements?: number
    currentGamerscore?: number
    totalGamerscore?: number
    progressPercentage?: number
  } | null
  titleHistory?: { lastTimePlayed?: string | null } | null
}
export type RawAchievement = {
  id: string
  name?: string
  description?: string
  lockedDescription?: string
  progressState?: string
  progression?: { timeUnlocked?: string | null } | null
  mediaAssets?: Array<{ type: string; url: string }>
  isSecret?: boolean
  rewards?: Array<{ type: string; value: string | null }>
  rarity?: { currentCategory?: string; currentPercentage?: number } | null
}
export type Raw360Achievement = {
  id: number
  titleId?: number
  imageId?: number
  name?: string
  description?: string
  lockedDescription?: string
  unlocked?: boolean
  isSecret?: boolean
  gamerscore?: number
  timeUnlocked?: string | null
  rarity?: { currentCategory?: string; currentPercentage?: number } | null
}

/**
 * Xbox's images come as http:// at times, which the site's CSP (and any https
 * page) refuses. Their plain hosts have no certificate for https, so they are
 * swapped for the `-ssl` twins that serve the very same files.
 */
function https(url: string | null | undefined): string | null {
  return url
    ? url
        .replace(/^https?:\/\/images-eds\.xboxlive\.com/, 'https://images-eds-ssl.xboxlive.com')
        .replace(/^https?:\/\/image\.xboxlive\.com/, 'https://image-ssl.xboxlive.com')
        .replace(/^http:\/\//, 'https://')
    : null
}

/** Xbox writes "never" as year 1; that is no date. */
function realDate(value: string | null | undefined): string | null {
  return value && !value.startsWith('0001') ? value : null
}

/** Xbox's own device codes as people write them. PC shows up twice ("PC" and "Win32"). */
const PLATFORM_NAMES: Record<string, string> = {
  Xbox360: 'Xbox 360',
  XboxOne: 'Xbox One',
  XboxSeries: 'Xbox Series',
  PC: 'PC',
  Win32: 'PC',
}

export function xboxPlatforms(devices: string[] | undefined): string[] {
  return [...new Set((devices ?? []).map((d) => PLATFORM_NAMES[d] ?? d))]
}

/** A profile comes as a list of {id, value} settings; null when there is no such account. */
export function toXboxProfile(user: RawProfileUser | undefined): XboxProfile | null {
  if (!user?.id) return null
  const settings = new Map((user.settings ?? []).map((s) => [s.id, s.value]))
  const gamertag = settings.get('Gamertag')
  if (!gamertag) return null
  return {
    xuid: String(user.id),
    gamertag,
    avatarUrl: https(settings.get('GameDisplayPicRaw')),
    bio: settings.get('Bio') ?? '',
    gamerscore: Number(settings.get('Gamerscore')) || 0,
    tier: settings.get('AccountTier') ?? '',
  }
}

/** One of Xbox's titles in the unified game model. Null for an id the app cannot key (never seen, but not trusted). */
export function toXboxGame(t: RawTitle): XboxGameProgress | null {
  const id = xboxNumericId(String(t.titleId))
  if (id === null) return null
  const a = t.achievement ?? {}
  const platforms = xboxPlatforms(t.devices)
  const total = a.totalAchievements ?? 0
  const totalGamerscore = a.totalGamerscore ?? 0
  const lastPlayed = realDate(t.titleHistory?.lastTimePlayed)
  return {
    _source: 'xbox',
    id,
    titleId: String(t.titleId),
    title: t.name,
    imageIcon: https(t.displayImage) ?? '',
    consoleName: platforms.join(' · '),
    platforms,
    is360: platforms.length === 1 && platforms[0] === 'Xbox 360',
    maxPossible: total,
    numAwarded: a.currentAchievements ?? 0,
    // A game with no gamerscore has no achievements: its total of 0 is real.
    totalKnown: total > 0 || totalGamerscore === 0,
    earnedGamerscore: a.currentGamerscore ?? 0,
    totalGamerscore,
    pctWon: a.progressPercentage ?? 0,
    lastPlayed,
    playtimeMinutes: null,
  }
}

export function toXboxAchievement(a: RawAchievement): XboxAchievement {
  const unlocked = a.progressState === 'Achieved'
  const score = a.rewards?.find((r) => r.type === 'Gamerscore')?.value
  return {
    id: String(a.id),
    name: a.name ?? '',
    description: (unlocked ? a.description : a.lockedDescription || a.description) ?? '',
    iconUrl: https(a.mediaAssets?.find((m) => m.type === 'Icon')?.url),
    gamerscore: Number(score) || 0,
    unlocked,
    unlockedAt: unlocked ? realDate(a.progression?.timeUnlocked) : null,
    secret: a.isSecret === true,
    rarity: a.rarity?.currentPercentage ?? null,
    rarityCategory: a.rarity?.currentCategory ?? null,
  }
}

/** An Xbox 360 icon is not sent as a URL, only as numbers: both go in hex into Xbox's classic image path. */
function xbox360Icon(a: Raw360Achievement): string | null {
  if (a.titleId == null || a.imageId == null) return null
  return `https://image-ssl.xboxlive.com/global/t.${a.titleId.toString(16)}/ach/0/${a.imageId.toString(16)}`
}

/** An Xbox 360 achievement: a flatter shape, and the icon built from its numbers. */
export function toXbox360Achievement(a: Raw360Achievement): XboxAchievement {
  const unlocked = a.unlocked === true
  return {
    id: String(a.id),
    name: a.name ?? '',
    description: (unlocked ? a.description : a.lockedDescription || a.description) ?? '',
    iconUrl: xbox360Icon(a),
    gamerscore: a.gamerscore ?? 0,
    unlocked,
    unlockedAt: unlocked ? realDate(a.timeUnlocked) : null,
    secret: a.isSecret === true,
    rarity: a.rarity?.currentPercentage ?? null,
    rarityCategory: a.rarity?.currentCategory ?? null,
  }
}

/**
 * A 360 game's full list: Xbox sends the title's achievements (all locked) and,
 * apart, the ones the account unlocked. The unlocked version wins; one the title
 * list lacks is kept rather than lost.
 */
export function merge360Achievements(all: Raw360Achievement[], earned: Raw360Achievement[]): XboxAchievement[] {
  const unlocked = new Map(earned.map((a) => [a.id, toXbox360Achievement(a)]))
  const merged = all.map((a) => unlocked.get(a.id) ?? toXbox360Achievement(a))
  const listed = new Set(all.map((a) => a.id))
  return [...merged, ...earned.filter((a) => !listed.has(a.id)).map(toXbox360Achievement)]
}

/** Most recently played first; games never played go last. */
/** Most recently played first; games never played go last. */
export function sortByLastPlayed(games: XboxGameProgress[]): XboxGameProgress[] {
  return [...games].sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))
}

/**
 * An Xbox achievement in RA's RecentAchievement shape, like psnToRecentAchievement:
 * so the streak, the heatmap and the shared activity cards take every platform as
 * one list. Gamerscore is not RA's points, so Points stays 0 and RA's totals are untouched.
 */
export function xboxToRecentAchievement(a: XboxRecentAchievement): RecentAchievement {
  return {
    Date: a.earnedAt.replace('T', ' ').slice(0, 19),
    HardcoreMode: '0',
    AchievementID: Number(a.achievementId) || 0,
    Title: a.name,
    Description: '',
    BadgeName: '',
    Points: 0,
    GameID: a.gameId,
    GameTitle: a.gameTitle,
    ConsoleName: XBOX_PLATFORM,
    Source: 'xbox',
    BadgeUrl: a.iconUrl ?? undefined,
    GameIconUrl: a.gameIconUrl,
  }
}
