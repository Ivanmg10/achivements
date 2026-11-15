'use client'

import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import type { PsnError } from '@/hooks/usePsnLink'
import type { PsnRecentTrophy } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import MainPageProfileRecentList from '../../main-page-profile-recent/MainPageProfileRecentList'

/** The player's latest trophies, with the trophy's grade on the right. Each opens that trophy on its game page. */
export default function MainPageProfilePsnTrophies({
  trophies,
  isLoading,
  error,
  onRetry,
}: {
  trophies: PsnRecentTrophy[]
  isLoading: boolean
  error: PsnError | null
  onRetry: () => void
}) {
  const { T } = useLanguage()
  const subject = useSubject()

  return (
    <MainPageProfileRecentList
      title={T.psn.recentTrophies}
      loading={isLoading && trophies.length === 0}
      error={error ? T.psn.trophiesError : null}
      onRetry={onRetry}
      retryLabel={T.psn.retry}
      items={trophies.map((t) => ({
        key: `${t.gameId}:${t.trophyId}`,
        href: `${gameHref('psn', t.gameId, subject)}#${psnTrophyAnchor(t.trophyId)}`,
        badge: t.iconUrl,
        title: t.name,
        gameTitle: t.gameTitle,
        at: t.earnedAt,
        right: <span className={`text-xs ${TROPHY_GRADE_COLOR[t.type]}`}>{T.psn[t.type]}</span>,
      }))}
    />
  )
}
