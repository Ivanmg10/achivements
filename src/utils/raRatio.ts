import type { RetroAchievementsUserProfile } from '@/types/types'

type Points = Pick<RetroAchievementsUserProfile, 'TotalPoints' | 'TotalSoftcorePoints' | 'TotalTruePoints'>

/** RA's RetroRatio: true points over hardcore points ("2,85"), a weight of difficulty, never a percentage. Null without hardcore points. */
export function retroRatio(user: Points): number | null {
  const hardcore = user.TotalPoints ?? 0
  return hardcore > 0 ? (user.TotalTruePoints ?? 0) / hardcore : null
}

/**
 * The avatar's ring: the hardcore colour when the account has more hardcore points than softcore,
 * the softcore colour when not, and a neutral one with no points at all.
 */
export function raPlayRing(user: Points): string {
  const hardcore = user.TotalPoints ?? 0
  const softcore = user.TotalSoftcorePoints ?? 0
  if (hardcore === 0 && softcore === 0) return 'rgb(var(--ink) / 0.3)'
  return hardcore > softcore ? 'rgb(var(--hardcore))' : 'rgb(var(--softcore))'
}
