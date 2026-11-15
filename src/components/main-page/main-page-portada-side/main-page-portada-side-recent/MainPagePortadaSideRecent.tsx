'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import { achievementBadgeUrl } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import MainPageProfileRecent from '@/components/main-page/main-page-profile/main-page-profile-recent/MainPageProfileRecent'
import MainPageProfileRecentRow from '@/components/main-page/main-page-profile/main-page-profile-recent/main-page-profile-recent-row/MainPageProfileRecentRow'

const SHOWN = 4

/** The last achievements on every platform, beside the cover: the profile's card, with the game under each. */
export default function MainPagePortadaSideRecent() {
  const { T } = useLanguage()
  const { achievements, isLoading, error, refetch } = useStreakData()
  const latest = [...achievements].sort((a, b) => b.Date.localeCompare(a.Date)).slice(0, SHOWN)

  return (
    <MainPageProfileRecent
      title={T.userCharts.recentAchievements}
      loading={isLoading && achievements.length === 0}
      error={error ? T.steam.achievementsError : null}
      onRetry={refetch}
      retryLabel={T.rankings.retry}
    >
      {latest.map((a) => (
        <MainPageProfileRecentRow
          key={`${a.Source ?? 'ra'}:${a.GameID}:${a.AchievementID}:${a.Date}`}
          href={gameHref(a.Source ?? 'ra', a.GameID)}
          badge={achievementBadgeUrl(a) ?? null}
          hardcore={a.HardcoreMode === '1'}
          title={a.Title}
          sub={a.GameTitle}
          right={a.Points > 0 ? a.Points : null}
        />
      ))}
    </MainPageProfileRecent>
  )
}
