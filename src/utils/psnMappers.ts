import type { RecentAchievement } from '@/types/types'
import type { PsnRecentTrophy } from '@/types/psn'

/** The console slot for PSN rows in the unified model. */
export const PSN_PLATFORM = 'PlayStation'

/**
 * A PSN trophy in RA's RecentAchievement shape, like Steam's
 * toRecentAchievement: so the streak, the heatmap and the shared activity
 * cards take all three platforms as one list. Trophies have no points.
 */
export function psnToRecentAchievement(t: PsnRecentTrophy): RecentAchievement {
  return {
    Date: t.earnedAt.replace('T', ' ').slice(0, 19),
    HardcoreMode: '0',
    AchievementID: t.trophyId,
    Title: t.name,
    Description: '',
    BadgeName: '',
    Points: 0,
    GameID: t.gameId,
    GameTitle: t.gameTitle,
    ConsoleName: PSN_PLATFORM,
    Source: 'psn',
    BadgeUrl: t.iconUrl ?? undefined,
    GameIconUrl: t.gameIconUrl,
  }
}
