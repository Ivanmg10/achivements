'use client'

import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import MainPageProfileRecent from '../../main-page-profile-recent/MainPageProfileRecent'
import MainPageProfileRecentRow from '../../main-page-profile-recent/main-page-profile-recent-row/MainPageProfileRecentRow'

export default function MainPageProfileRaAchievements({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  return (
    <MainPageProfileRecent title={T.profileAchievements.recentAchievements} loading={isLoading && achievements.length === 0}>
      {achievements.slice(0, 3).map((ach) => (
        <MainPageProfileRecentRow
          key={ach.AchievementID}
          href={gameHref('ra', ach.GameID, subject)}
          badge={`https://media.retroachievements.org/Badge/${ach.BadgeName}.png`}
          hardcore={ach.HardcoreMode === '1'}
          title={ach.Title}
          sub={<>{ach.GameTitle} · <time dateTime={ach.Date}>{new Date(ach.Date).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</time></>}
          right={ach.Points}
        />
      ))}
    </MainPageProfileRecent>
  )
}
