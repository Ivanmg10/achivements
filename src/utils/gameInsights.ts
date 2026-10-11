import type { RetroAchievement } from '@/types/types'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import { psnTrophyAnchor } from '@/utils/psnTitles'
import { gameHref } from '@/utils/gameRef'

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
