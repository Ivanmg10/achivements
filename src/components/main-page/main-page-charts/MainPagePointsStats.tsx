'use client'

import type { RecentAchievement, UserRankAndScore } from '@/types/types'
import { plural } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import MainPagePeriodStats from '../main-page-period-stats/MainPagePeriodStats'

/** RA's stat pills (points), or, in Portada, the five activity figures counting unlocks of every platform. */
export default function MainPagePointsStats({
  achievements,
  heatmapAchievements,
  streak = 0,
  rank,
  showRank = true,
  valueMode = 'points',
  isLoading,
}: {
  achievements: RecentAchievement[]
  /** RA's last 60 days: this month and the average read them. */
  heatmapAchievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak?: number
  rank: UserRankAndScore | null
  /** Portada keeps only the five activity figures; Classic also shows global rank. */
  showRank?: boolean
  /** Global cover stats count unlocks; Classic's platform-specific stats count RA points. */
  valueMode?: 'points' | 'achievements'
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const points = valueMode === 'points'

  return (
    <MainPagePeriodStats
      achievements={achievements}
      monthSource={heatmapAchievements}
      streak={streak}
      isLoading={isLoading}
      measure={valueMode === 'points' ? 'points' : 'unlocks'}
      unit={(n) => (points ? plural(n, T.plurals.achievements, lang) : undefined)}
      before={showRank ? [{
        label: T.userStats.globalRank,
        figure: rank?.Rank != null
          ? { label: T.userStats.globalRank, value: `#${rank.Rank.toLocaleString(lang)}`, sub: `${(rank.Score ?? 0).toLocaleString(lang)} ${T.libraryDetail.pointsShort}` }
          : null,
      }] : []}
    />
  )
}
