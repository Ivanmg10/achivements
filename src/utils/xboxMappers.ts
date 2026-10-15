import type { XboxAchievement, XboxGame, XboxProfile } from '@/types/xbox'

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
  name?: string
  description?: string
  lockedDescription?: string
  unlocked?: boolean
  isSecret?: boolean
  gamerscore?: number
  timeUnlocked?: string | null
  rarity?: { currentCategory?: string; currentPercentage?: number } | null
}

/** Xbox's images come as http:// at times, which the site's CSP (and any https page) refuses. */
function https(url: string | null | undefined): string | null {
  return url ? url.replace(/^http:\/\//, 'https://') : null
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
    gamerscore: Number(settings.get('Gamerscore')) || 0,
    tier: settings.get('AccountTier') ?? '',
  }
}

export function toXboxGame(t: RawTitle): XboxGame {
  const a = t.achievement ?? {}
  const devices = xboxPlatforms(t.devices)
  const total = a.totalAchievements ?? 0
  return {
    titleId: String(t.titleId),
    name: t.name,
    imageUrl: https(t.displayImage),
    platforms: devices,
    is360: devices.length === 1 && devices[0] === 'Xbox 360',
    earnedAchievements: a.currentAchievements ?? 0,
    totalAchievements: total > 0 ? total : null,
    earnedGamerscore: a.currentGamerscore ?? 0,
    totalGamerscore: a.totalGamerscore ?? 0,
    progress: a.progressPercentage ?? 0,
    lastPlayed: realDate(t.titleHistory?.lastTimePlayed),
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

/** An Xbox 360 achievement: a flatter shape, with no icon URL (Xbox sends an image number only). */
export function toXbox360Achievement(a: Raw360Achievement): XboxAchievement {
  const unlocked = a.unlocked === true
  return {
    id: String(a.id),
    name: a.name ?? '',
    description: (unlocked ? a.description : a.lockedDescription || a.description) ?? '',
    iconUrl: null,
    gamerscore: a.gamerscore ?? 0,
    unlocked,
    unlockedAt: unlocked ? realDate(a.timeUnlocked) : null,
    secret: a.isSecret === true,
    rarity: a.rarity?.currentPercentage ?? null,
    rarityCategory: a.rarity?.currentCategory ?? null,
  }
}

/** Most recently played first; games never played go last. */
export function sortByLastPlayed(games: XboxGame[]): XboxGame[] {
  return [...games].sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))
}
