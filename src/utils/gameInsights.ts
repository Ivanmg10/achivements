import type { RecentAchievement, RetroAchievement } from '@/types/types'
import type { GameSource, SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import { psnTrophyAnchor } from '@/utils/psnTitles'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxAchievement } from '@/types/xbox'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'

/** An achievement or trophy of any platform, reduced to what a library card tells. */
export type InsightAchievement = {
  id: string
  title: string
  description: string
  earned: boolean
  earnedAt: string | null
  /** Share of players who have it, 0–100; null when the platform does not say. */
  rarity: number | null
  /** RA points; the other platforms have none. */
  points: number | null
  /** RA tags: what the game needs to be beaten, and what can be missed for good. */
  kind: 'progression' | 'win_condition' | 'missable' | null
  iconUrl: string | null
  href: string
}

const KINDS = ['progression', 'win_condition', 'missable'] as const

export function fromRa(list: RetroAchievement[], players: number, gameId: number | string): InsightAchievement[] {
  return list.map((a) => {
    const at = a.DateEarnedHardcore ?? a.DateEarned ?? null
    const kind = KINDS.find((k) => k === a.Type) ?? null
    return {
      id: String(a.ID),
      title: a.Title,
      description: a.Description,
      earned: !!at,
      earnedAt: at,
      rarity: players > 0 ? Math.min(100, (a.NumAwarded / players) * 100) : null,
      points: a.Points,
      kind,
      iconUrl: a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}.png` : null,
      href: `/gameInfo/${gameId}`,
    }
  })
}

export const fromSteam = (list: SteamAchievementUnified[], appId: number): InsightAchievement[] =>
  list.map((a) => ({
    id: a.apiname,
    title: a.title,
    description: a.description,
    earned: a.earned,
    earnedAt: a.dateEarned,
    rarity: a.globalPct,
    points: null,
    kind: null,
    iconUrl: a.badgeUrl || null,
    href: `/steamGame/${appId}#${achievementAnchor(a.apiname)}`,
  }))

export const fromPsn = (list: PsnTrophy[], gameId: number): InsightAchievement[] =>
  list.map((t) => ({
    id: String(t.id),
    title: t.name,
    description: t.detail,
    earned: t.earned,
    earnedAt: t.earnedAt,
    rarity: t.rarity,
    points: null,
    kind: null,
    iconUrl: t.iconUrl,
    href: `${gameHref('psn', gameId)}#${psnTrophyAnchor(t.id)}`,
  }))

export const fromXbox = (list: XboxAchievement[], gameId: number): InsightAchievement[] =>
  list.map((a) => ({
    id: a.id,
    title: a.name,
    description: a.description,
    earned: a.unlocked,
    earnedAt: a.unlockedAt,
    rarity: a.rarity,
    points: null,
    kind: null,
    iconUrl: a.iconUrl,
    href: `${gameHref('xbox', gameId)}#${xboxAchievementAnchor(a.id)}`,
  }))

/** Most common first; a band holds everything from its floor up to the previous band's. */
export const RARITY_BANDS = [
  { id: 'common', floor: 25 },
  { id: 'uncommon', floor: 10 },
  { id: 'rare', floor: 3 },
  { id: 'ultra', floor: 0 },
] as const
export type RarityBand = (typeof RARITY_BANDS)[number]['id']

export function rarityBands(items: InsightAchievement[]): { id: RarityBand; total: number; earned: number }[] {
  const bands = RARITY_BANDS.map((b) => ({ id: b.id as RarityBand, total: 0, earned: 0 }))
  for (const a of items) {
    if (a.rarity === null) continue
    const band = bands[RARITY_BANDS.findIndex((b) => a.rarity! >= b.floor)]
    band.total++
    if (a.earned) band.earned++
  }
  return bands
}

const byTitle = (a: InsightAchievement, b: InsightAchievement) => a.title.localeCompare(b.title)

/** What is left, the most-owned first: the likeliest to get next. Those with no rarity are left out. */
export const nextTargets = (items: InsightAchievement[], n = 4) =>
  items.filter((a) => !a.earned && a.rarity !== null).sort((a, b) => b.rarity! - a.rarity! || byTitle(a, b)).slice(0, n)

/** What has been earned, the rarest first. */
export const rarestEarned = (items: InsightAchievement[], n = 4) =>
  items.filter((a) => a.earned && a.rarity !== null).sort((a, b) => a.rarity! - b.rarity! || byTitle(a, b)).slice(0, n)

const DAY = 86_400_000
/** Beyond this many weeks an estimate says nothing, so none is given. */
const MAX_WEEKS = 104
/** Fewer unlocks than this are not a pace. */
const MIN_UNLOCKS = 3

/**
 * How fast achievements have come since the first one, counted until today so a
 * game left alone for months does not look quick. null without enough dates.
 */
export function paceEstimate(items: InsightAchievement[], now = Date.now()): { perWeek: number; weeksLeft: number | null } | null {
  const times = items.filter((a) => a.earned && a.earnedAt).map((a) => Date.parse(a.earnedAt!)).filter((t) => !Number.isNaN(t))
  const remaining = items.filter((a) => !a.earned).length
  if (times.length < MIN_UNLOCKS || remaining === 0) return null
  const days = Math.max(7, (now - Math.min(...times)) / DAY)
  const perWeek = (times.length / days) * 7
  const weeks = Math.ceil(remaining / perWeek)
  return { perWeek, weeksLeft: weeks > MAX_WEEKS ? null : weeks }
}

/** RA path to beat the game: its progression and win-condition achievements. null when the game has none tagged. */
export function beatenProgress(items: InsightAchievement[]): { done: number; total: number } | null {
  const path = items.filter((a) => a.kind === 'progression' || a.kind === 'win_condition')
  return path.length ? { done: path.filter((a) => a.earned).length, total: path.length } : null
}

/** Missable achievements still not earned. */
export const missablesLeft = (items: InsightAchievement[]) => items.filter((a) => a.kind === 'missable' && !a.earned).length

/** When the last achievement fell, for a game with every one earned. */
export function finishedAt(items: InsightAchievement[]): string | null {
  if (items.length === 0 || items.some((a) => !a.earned)) return null
  const times = items.map((a) => (a.earnedAt ? Date.parse(a.earnedAt) : NaN)).filter((t) => !Number.isNaN(t))
  return times.length ? new Date(Math.max(...times)).toISOString() : null
}

/** What was earned last, newest first. */
export const recentEarned = (items: InsightAchievement[], n = 5) =>
  items
    .filter((a) => a.earned && a.earnedAt && !Number.isNaN(Date.parse(a.earnedAt)))
    .sort((a, b) => Date.parse(b.earnedAt!) - Date.parse(a.earnedAt!))
    .slice(0, n)

/** The rarest of all, earned or not: what the game asks of whoever wants it complete. */
export const hardest = (items: InsightAchievement[], n = 4) =>
  items.filter((a) => a.rarity !== null).sort((a, b) => a.rarity! - b.rarity! || byTitle(a, b)).slice(0, n)

/** A step on the way to 100%: the first achievement, then each quarter. `at` is when it was reached, null if not yet. */
export type Milestone = { pct: number; at: string | null; left: number }

export function milestones(items: InsightAchievement[]): Milestone[] {
  const total = items.length
  if (total === 0) return []
  const dates = items
    .filter((a) => a.earned && a.earnedAt && !Number.isNaN(Date.parse(a.earnedAt)))
    .map((a) => a.earnedAt!)
    .sort((a, b) => Date.parse(a) - Date.parse(b))
  // pct 0 stands for "the first one". Steps that need the same count of achievements are one:
  // the first stays the first, any other is the furthest of them (3 of 3 is 100%, not 75%).
  const byNeeded = new Map<number, number>()
  for (const pct of [0, 25, 50, 75, 100]) {
    const needed = pct === 0 ? 1 : Math.ceil((total * pct) / 100)
    if (needed !== 1 || !byNeeded.has(1)) byNeeded.set(needed, pct)
  }
  return [...byNeeded].map(([needed, pct]) => ({
    pct,
    at: dates.length >= needed ? dates[needed - 1] : null,
    left: Math.max(0, needed - dates.length),
  }))
}

/** The game a calendar or a list of unlocks is about, for the cards that link back to it. */
export type InsightGame = { source: GameSource; id: number; title: string; iconUrl?: string }

/** The unlocks in the shape the activity calendar and its day list already take (RA's), whichever platform they are from. */
export function toRecentAchievements(items: InsightAchievement[], game: InsightGame): RecentAchievement[] {
  return items
    .filter((a) => a.earned && a.earnedAt && !Number.isNaN(Date.parse(a.earnedAt)))
    .map((a) => ({
      Date: a.earnedAt!.replace('T', ' ').slice(0, 19),
      HardcoreMode: '0',
      AchievementID: Number(a.id) || 0,
      Title: a.title,
      Description: a.description,
      BadgeName: '',
      Points: a.points ?? 0,
      GameID: game.id,
      GameTitle: game.title,
      ConsoleName: PLATFORM_NAME[game.source],
      Source: game.source === 'ra' ? undefined : game.source,
      BadgeUrl: a.iconUrl ?? undefined,
      GameIconUrl: game.iconUrl,
    }))
}

/** Within this many days of today, a game's calendar ends today; before that, where its last unlock was. */
const CALENDAR_RECENT_DAYS = 3

/** The last day a game's calendar shows: today for a game played lately, else its last unlock. */
export function calendarEnd(items: InsightAchievement[], now = Date.now()): Date | undefined {
  const times = items.filter((a) => a.earned && a.earnedAt).map((a) => Date.parse(a.earnedAt!)).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return undefined
  const last = Math.max(...times)
  return now - last <= CALENDAR_RECENT_DAYS * DAY ? undefined : new Date(last)
}
