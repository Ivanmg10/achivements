import type { RetroAchievement } from '@/types/types'
import type { SteamPlayerAchievement } from '@/types/steam'
import type { PsnTrophy, TrophyCounts } from '@/types/psn'
import type { XboxAchievement } from '@/types/xbox'
import type { ScoreAchievement } from '@/utils/vaultScore'

/**
 * Each platform's achievements as the score reads them (see vaultScore). The
 * native value is the platform's own weighting; the rarity, its share of players.
 */

/** PSN grades as Sony weighs them, except the platinum, counted as a gold: it is the game, finished, and the completion bonus already rewards that. */
export const PSN_GRADE: Record<keyof TrophyCounts, number> = { bronze: 15, silver: 30, gold: 90, platinum: 90 }

/** RA dates come as "2024-03-05 18:22:10", in UTC. */
function raIso(date: string | null | undefined): string | null {
  if (!date) return null
  const iso = date.includes('T') ? date : `${date.replace(' ', 'T')}Z`
  return Number.isFinite(Date.parse(iso)) ? iso : null
}

/** RA: the developer's points, rarity over everyone who loaded the game; softcore earns half. */
export function raScoreInputs(achievements: Record<string, RetroAchievement | undefined>, players: number): ScoreAchievement[] {
  return Object.values(achievements)
    .filter((a): a is RetroAchievement => Boolean(a))
    .map((a) => {
      const hardcore = raIso(a.DateEarnedHardcore)
      const any = hardcore ?? raIso(a.DateEarned)
      return {
        native: a.Points,
        rarity: players > 0 ? Math.min(100, (a.NumAwarded / players) * 100) : null,
        earned: any !== null,
        earnedAt: any,
        softcore: any !== null && hardcore === null,
      }
    })
}

/** Steam: every achievement is one; rarity from the global percentages (when Steam gives them). */
export function steamScoreInputs(unlocks: SteamPlayerAchievement[], globalPct: Map<string, number>): ScoreAchievement[] {
  return unlocks.map((a) => ({
    native: 1,
    rarity: globalPct.get(a.apiname) ?? null,
    earned: a.achieved === 1,
    earnedAt: a.achieved === 1 && a.unlocktime > 0 ? new Date(a.unlocktime * 1000).toISOString() : null,
  }))
}

export function psnScoreInputs(trophies: PsnTrophy[]): ScoreAchievement[] {
  return trophies.map((t) => ({ native: PSN_GRADE[t.type] ?? 15, rarity: t.rarity, earned: t.earned, earnedAt: t.earned ? t.earnedAt : null }))
}

export function xboxScoreInputs(achievements: XboxAchievement[]): ScoreAchievement[] {
  return achievements.map((a) => ({ native: a.gamerscore, rarity: a.rarity, earned: a.unlocked, earnedAt: a.unlocked ? a.unlockedAt : null }))
}

/** A PSN game's progress from its trophy counts alone, weighed by grade (0–1). */
export function psnGradeShare(earned: TrophyCounts, defined: TrophyCounts): number {
  const sum = (c: TrophyCounts) => (Object.keys(PSN_GRADE) as (keyof TrophyCounts)[]).reduce((s, k) => s + (c[k] ?? 0) * PSN_GRADE[k], 0)
  const total = sum(defined)
  return total > 0 ? sum(earned) / total : 0
}

/** The consoles a user unticked for one platform, from the preferences that follow the account. */
export function hiddenConsolesFrom(preferences: Record<string, unknown> | null | undefined, source: string): Set<string> {
  const raw = preferences?.[`hidden-consoles:${source}`]
  if (typeof raw !== 'string') return new Set()
  try {
    const list: unknown = JSON.parse(raw)
    return new Set(Array.isArray(list) ? list.filter((n): n is string => typeof n === 'string') : [])
  } catch {
    return new Set()
  }
}
