'use client'

import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import type { PsnError } from '@/hooks/usePsnLink'
import type { PsnRecentTrophy } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import MainPageProfileRecent from '../../main-page-profile-recent/MainPageProfileRecent'
import MainPageProfileRecentRow from '../../main-page-profile-recent/main-page-profile-recent-row/MainPageProfileRecentRow'

/**
 * The player's latest trophies — the Steam list's counterpart, same layout,
 * with the trophy's grade under its name. Each opens that trophy on its game
 * page.
 */
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
  const { T, lang } = useLanguage()
  const subject = useSubject()
  const grade = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }

  return (
    <MainPageProfileRecent
      title={T.psn.recentTrophies}
      loading={isLoading && trophies.length === 0}
      error={error ? T.psn.trophiesError : null}
      onRetry={onRetry}
      retryLabel={T.psn.retry}
    >
      {trophies.slice(0, 3).map((t) => (
        <MainPageProfileRecentRow
          key={`${t.gameId}:${t.trophyId}`}
          href={`${gameHref('psn', t.gameId, subject)}#${psnTrophyAnchor(t.trophyId)}`}
          badge={t.iconUrl}
          title={t.name}
          sub={<>{t.gameTitle} · <time dateTime={t.earnedAt}>{new Date(t.earnedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</time></>}
          right={<span className={`text-xs ${TROPHY_GRADE_COLOR[t.type]}`}>{grade[t.type]}</span>}
        />
      ))}
    </MainPageProfileRecent>
  )
}
