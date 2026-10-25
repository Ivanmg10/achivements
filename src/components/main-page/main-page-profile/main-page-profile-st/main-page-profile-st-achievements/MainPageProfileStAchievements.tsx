'use client'

import { useLanguage } from '@/context/LanguageContext'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import type { SteamRecentAchievement } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import MainPageProfileRecent from '../../main-page-profile-recent/MainPageProfileRecent'
import MainPageProfileRecentRow from '../../main-page-profile-recent/main-page-profile-recent-row/MainPageProfileRecentRow'

/**
 * The player's latest Steam unlocks — MainPageProfileRaAchievements'
 * counterpart, same layout. Steam has no points, so the unlock date takes the
 * right-hand slot. Each opens that achievement on its game page.
 */
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
  const { T, lang } = useLanguage()
  const subject = useSubject()

  return (
    <MainPageProfileRecent
      title={T.profileAchievements.recentAchievements}
      loading={isLoading && achievements.length === 0}
      error={error ? T.steam.achievementsError : null}
      onRetry={onRetry}
      retryLabel={T.steam.retry}
    >
      {achievements.slice(0, 3).map((a) => (
        <MainPageProfileRecentRow
          key={`${a.appId}:${a.apiname}`}
          href={`${gameHref('steam', a.appId, subject)}#${achievementAnchor(a.apiname)}`}
          badge={a.badgeUrl || null}
          title={a.title}
          sub={<>{a.gameTitle} · <time dateTime={a.unlockedAt}>{new Date(a.unlockedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</time></>}
        />
      ))}
    </MainPageProfileRecent>
  )
}
