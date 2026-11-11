'use client'

import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import { raBadgeUrl } from '@/utils/raAssets'
import MainPageProfileRecentList from '../../main-page-profile-recent/MainPageProfileRecentList'

/** The player's latest RetroAchievements unlocks, with the points on the right and hardcore ringed. */
export default function MainPageProfileRaAchievements({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const subject = useSubject()

  return (
    <MainPageProfileRecentList
      title={T.profileAchievements.recentAchievements}
      loading={isLoading && achievements.length === 0}
      items={achievements.map((ach) => ({
        key: String(ach.AchievementID),
        href: gameHref('ra', ach.GameID, subject),
        badge: raBadgeUrl(ach.BadgeName) ?? null,
        hardcore: ach.HardcoreMode === '1',
        title: ach.Title,
        gameTitle: ach.GameTitle,
        at: ach.Date,
        right: ach.Points,
      }))}
    />
  )
}
