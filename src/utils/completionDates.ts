import type { PsnTrophy } from '@/types/psn'
import type { UserAward } from '@/types/types'

/** A date is metadata only when the platform supplied a parseable value. */
export function validCompletionDate(value: string | null | undefined): string | null {
  return value && Number.isFinite(Date.parse(value)) ? value : null
}

/**
 * PSN base completion, never whole-set activity: an earned platinum is Sony's
 * base-completion concept. Without one, a fully earned default group supplies
 * its own last base trophy. DLC groups and missing dates cannot move or invent it.
 */
export function psnBaseCompletedAt(trophies: PsnTrophy[]): string | null {
  const base = trophies.filter((trophy) => trophy.groupId === 'default')
  const platinum = base.find((trophy) => trophy.type === 'platinum' && trophy.earned)
  if (platinum) return validCompletionDate(platinum.earnedAt)
  if (base.length === 0 || base.some((trophy) => !trophy.earned)) return null
  const dates = base.map((trophy) => validCompletionDate(trophy.earnedAt)).filter((date): date is string => date !== null)
  if (dates.length !== base.length) return null
  return dates.reduce((latest, date) => date > latest ? date : latest, dates[0])
}

/** Steam/Xbox rule: latest earned achievement only when the whole current set is earned. */
export function latestFullSetCompletedAt(achievements: { earned: boolean; earnedAt: string | null }[]): string | null {
  if (achievements.length === 0 || achievements.some((achievement) => !achievement.earned)) return null
  const dates = achievements.map((achievement) => validCompletionDate(achievement.earnedAt)).filter((date): date is string => date !== null)
  if (dates.length !== achievements.length) return null
  return dates.reduce((latest, date) => date > latest ? date : latest, dates[0])
}

export function xboxFullSetCompletedAt(achievements: { unlocked: boolean; unlockedAt: string | null }[]): string | null {
  return latestFullSetCompletedAt(achievements.map((achievement) => ({ earned: achievement.unlocked, earnedAt: achievement.unlockedAt })))
}

export function raLatestCompletionAward(awards: UserAward[], gameId: number): string | null {
  const dates = awards
    .filter((award) => award.AwardData === gameId && award.AwardType === 'Mastery/Completion')
    .map((award) => validCompletionDate(award.AwardedAt))
    .filter((date): date is string => date !== null)
  return dates.length ? dates.reduce((latest, date) => date > latest ? date : latest, dates[0]) : null
}

/** RA records completion/mastery separately from achievement activity and subsets. */
export function raAwardCompletedAt(game: { HighestAwardKind?: string | null; HighestAwardDate?: string | null }): string | null {
  return game.HighestAwardKind === 'mastered' || game.HighestAwardKind === 'completed' ? validCompletionDate(game.HighestAwardDate) : null
}
