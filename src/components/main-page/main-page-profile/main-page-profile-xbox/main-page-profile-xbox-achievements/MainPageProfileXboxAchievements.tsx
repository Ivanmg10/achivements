'use client'

import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxLinkError } from '@/hooks/useXboxLink'
import type { XboxRecentAchievement } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'
import MainPageProfileRecent from '../../main-page-profile-recent/MainPageProfileRecent'
import MainPageProfileRecentRow from '../../main-page-profile-recent/main-page-profile-recent-row/MainPageProfileRecentRow'

/**
 * The player's latest achievements — the PSN list's counterpart, same layout,
 * with the gamerscore under the name. Each opens that achievement on its game
 * page.
 */
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
  const { T, lang } = useLanguage()
  const subject = useSubject()

  return (
    <MainPageProfileRecent
      title={T.xbox.recentAchievements}
      loading={isLoading && achievements.length === 0}
      error={error ? T.xbox.achievementsError : null}
      onRetry={onRetry}
      retryLabel={T.xbox.retry}
    >
      {achievements.slice(0, 3).map((a) => (
        <MainPageProfileRecentRow
          key={`${a.gameId}:${a.achievementId}`}
          href={`${gameHref('xbox', a.gameId, subject)}#${xboxAchievementAnchor(a.achievementId)}`}
          badge={a.iconUrl}
          title={a.name}
          sub={<>{a.gameTitle} · <time dateTime={a.earnedAt}>{new Date(a.earnedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</time></>}
          right={`${a.gamerscore} G`}
        />
      ))}
    </MainPageProfileRecent>
  )
}
