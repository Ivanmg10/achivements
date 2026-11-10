import { parseUnlockTime } from '@/utils/dates'
import type { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import type { GameAchievement } from '@/types/game'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy, TrophyGrade } from '@/types/psn'
import { psnTrophyAnchor } from '@/utils/psnTitles'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxAchievement } from '@/types/xbox'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import { raBadgeUrl } from '@/utils/raAssets'
import { raAchievementList } from '@/utils/gameAchievements'

/** One achievement of a game as someone has it, the same on every platform: the compare table's and the game page table's row. */
export type CompareAchievement = GameAchievement & {
  /** RA's points. */
  points?: number
  /** PSN's grade. */
  grade?: TrophyGrade
  /** Xbox's gamerscore for it. */
  gamerscore?: number
  /** Where a link to it lands on the page (Steam, PSN and Xbox deep links use it). `earnedAt` is RA's hardcore date when there is one. */
  anchor?: string
  /** RA only: earned in hardcore. */
  hardcore?: boolean
  /** Its name and text are kept back until it is earned (PSN's hidden trophies, Xbox's and Steam's secret achievements). */
  secret?: boolean
}

export type Unlock = Pick<CompareAchievement, 'earned' | 'earnedAt' | 'hardcore'>

/** An achievement as the profile's owner has it, and as the viewer does when comparing (null: not asked, or no data). */
export type CompareRow = CompareAchievement & { mine: Unlock | null }

export type CompareFilter = 'all' | 'both' | 'onlyThem' | 'onlyMe' | 'neither'

/** RA's achievement as a row; `players` is the game's distinct players, what its rarity is a share of. */
export const raCompareItem =
  (players: number) =>
  (a: RetroAchievement): CompareAchievement => ({
    id: String(a.ID),
    title: a.Title,
    description: a.Description,
    iconUrl: raBadgeUrl(a.BadgeName) ?? null,
    points: a.Points,
    rarity: players > 0 ? Math.min(100, (a.NumAwarded / players) * 100) : null,
    earned: Boolean(a.DateEarned || a.DateEarnedHardcore),
    earnedAt: a.DateEarnedHardcore || a.DateEarned || null,
    hardcore: Boolean(a.DateEarnedHardcore),
  })

export function raCompareList(game: RetroAchievementsGameWithAchievements | null): CompareAchievement[] {
  if (!game) return []
  return raAchievementList(game)
    .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
    .map(raCompareItem(game.NumDistinctPlayers || 0))
}

export const steamCompareItem = (a: SteamAchievementUnified): CompareAchievement => ({
  id: a.apiname,
  title: a.title,
  description: a.description,
  iconUrl: a.badgeUrl || null,
  rarity: a.globalPct,
  anchor: achievementAnchor(a.apiname),
  earned: a.earned,
  earnedAt: a.dateEarned,
  secret: a.hidden,
})

export const steamCompareList = (achievements: SteamAchievementUnified[]): CompareAchievement[] =>
  [...achievements].sort((a, b) => a.displayOrder - b.displayOrder).map(steamCompareItem)

export const psnCompareItem = (t: PsnTrophy): CompareAchievement => ({
  id: String(t.id),
  title: t.name,
  description: t.detail,
  iconUrl: t.iconUrl,
  grade: t.type,
  rarity: t.rarity,
  anchor: psnTrophyAnchor(t.id),
  earned: t.earned,
  earnedAt: t.earnedAt,
  secret: t.hidden,
})

export const psnCompareList = (trophies: PsnTrophy[]): CompareAchievement[] => trophies.map(psnCompareItem)

export const xboxCompareItem = (a: XboxAchievement): CompareAchievement => ({
  id: a.id,
  title: a.name,
  description: a.description,
  iconUrl: a.iconUrl,
  gamerscore: a.gamerscore,
  rarity: a.rarity,
  anchor: xboxAchievementAnchor(a.id),
  earned: a.unlocked,
  earnedAt: a.unlockedAt,
  secret: a.secret,
})

export const xboxCompareList = (achievements: XboxAchievement[]): CompareAchievement[] => achievements.map(xboxCompareItem)

/** Their list with the viewer's unlock beside each achievement; `mine` null leaves every row without one. */
export function mergeCompare(theirs: CompareAchievement[], mine: CompareAchievement[] | null): CompareRow[] {
  const byId = new Map((mine ?? []).map((a) => [a.id, a]))
  return theirs.map((a) => {
    const m = byId.get(a.id)
    return { ...a, mine: mine === null ? null : { earned: m?.earned ?? false, earnedAt: m?.earnedAt ?? null, hardcore: m?.hardcore } }
  })
}

const mineEarned = (r: CompareRow) => r.mine?.earned === true

export function filterCompare(rows: CompareRow[], filter: CompareFilter): CompareRow[] {
  switch (filter) {
    case 'both':
      return rows.filter((r) => r.earned && mineEarned(r))
    case 'onlyThem':
      return rows.filter((r) => r.earned && !mineEarned(r))
    case 'onlyMe':
      return rows.filter((r) => !r.earned && mineEarned(r))
    case 'neither':
      return rows.filter((r) => !r.earned && !mineEarned(r))
    default:
      return rows
  }
}

export type CompareSummary = Record<CompareFilter, number> & { theirs: number; mine: number }

export function compareSummary(rows: CompareRow[]): CompareSummary {
  const count = (f: CompareFilter) => filterCompare(rows, f).length
  return {
    all: rows.length,
    both: count('both'),
    onlyThem: count('onlyThem'),
    onlyMe: count('onlyMe'),
    neither: count('neither'),
    theirs: rows.filter((r) => r.earned).length,
    mine: rows.filter(mineEarned).length,
  }
}

/** Who unlocked it first, when both did and both dates are known. */
export function firstToUnlock(row: CompareRow): 'them' | 'me' | null {
  if (!row.earned || !row.earnedAt || !row.mine?.earned || !row.mine.earnedAt) return null
  const them = parseUnlockTime(row.earnedAt)
  const me = parseUnlockTime(row.mine.earnedAt)
  if (Number.isNaN(them) || Number.isNaN(me) || them === me) return null
  return them < me ? 'them' : 'me'
}

/** An unlock's day in the given locale ("3 Oct 2026" in en-GB); null for a missing or unreadable date. */
export function formatUnlockDate(date: string | null, lang: string): string | null {
  if (!date) return null
  const d = new Date(parseUnlockTime(date))
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })
}
