'use client'

import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxLinkError } from '@/hooks/useXboxLink'
import type { XboxRecentAchievement } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'
import MainPageProfileRecentList from '../../main-page-profile-recent/MainPageProfileRecentList'

/** The player's latest achievements, with the gamerscore on the right. Each opens that achievement on its game page. */
export default function MainPageProfileXboxAchievements({
  achievements,
  isLoading,
  error,
  onRetry,
}: {
  achievements: XboxRecentAchievement[]
  isLoading: boolean
  error: XboxLinkError | null
  onRetry: () => void
}) {
  const { T } = useLanguage()
  const subject = useSubject()

  return (
    <MainPageProfileRecentList
      title={T.xbox.recentAchievements}
      loading={isLoading && achievements.length === 0}
      error={error ? T.xbox.achievementsError : null}
      onRetry={onRetry}
      retryLabel={T.xbox.retry}
      items={achievements.map((a) => ({
        key: `${a.gameId}:${a.achievementId}`,
        href: `${gameHref('xbox', a.gameId, subject)}#${xboxAchievementAnchor(a.achievementId)}`,
        badge: a.iconUrl,
        title: a.name,
        gameTitle: a.gameTitle,
        at: a.earnedAt,
        right: `${a.gamerscore} G`,
      }))}
    />
  )
}
