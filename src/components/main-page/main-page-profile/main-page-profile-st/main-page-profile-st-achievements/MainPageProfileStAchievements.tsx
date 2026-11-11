'use client'

import { useLanguage } from '@/context/LanguageContext'
import { steamAchievementAnchor } from '@/utils/steamTitles'
import type { SteamRecentAchievement } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import MainPageProfileRecentList from '../../main-page-profile-recent/MainPageProfileRecentList'

/** The player's latest Steam unlocks. Steam has no points, so nothing stands on the right. Each opens that achievement on its game page. */
export default function MainPageProfileStAchievements({
  achievements,
  isLoading,
  error,
  onRetry,
}: {
  achievements: SteamRecentAchievement[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
}) {
  const { T } = useLanguage()
  const subject = useSubject()

  return (
    <MainPageProfileRecentList
      title={T.profileAchievements.recentAchievements}
      loading={isLoading && achievements.length === 0}
      error={error ? T.steam.achievementsError : null}
      onRetry={onRetry}
      retryLabel={T.steam.retry}
      items={achievements.map((a) => ({
        key: `${a.appId}:${a.apiname}`,
        href: `${gameHref('steam', a.appId, subject)}#${steamAchievementAnchor(a.apiname)}`,
        badge: a.badgeUrl || null,
        title: a.title,
        gameTitle: a.gameTitle,
        at: a.unlockedAt,
      }))}
    />
  )
}
