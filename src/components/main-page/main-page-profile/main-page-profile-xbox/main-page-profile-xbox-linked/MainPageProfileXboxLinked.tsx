'use client'

import { useMemo } from 'react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'
import type { XboxLinkError } from '@/hooks/useXboxLink'
import { xboxHasAchievements } from '@/utils/xboxTitles'
import type { XboxSummary } from '@/types/xbox'
import MainPageProfileActions from '../../main-page-profile-actions/MainPageProfileActions'
import MainPageProfileError from '../../main-page-profile-error/MainPageProfileError'
import MainPageProfileXboxStats from '../main-page-profile-xbox-stats/MainPageProfileXboxStats'
import MainPageProfileXboxGame from '../main-page-profile-xbox-game/MainPageProfileXboxGame'
import MainPageProfileXboxAchievements from '../main-page-profile-xbox-achievements/MainPageProfileXboxAchievements'
import MainPageProfileSkeleton from '../../main-page-profile-skeleton/MainPageProfileSkeleton'
import MainPageProfileGameSkeleton from '../../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import MainPageProfileCard from '../../main-page-profile-card/MainPageProfileCard'

/**
 * A linked Xbox profile, built like the PSN one block for block: header
 * (avatar, gamertag, tier, bio, link out), four stats, the last game played with
 * its progress, and the latest achievements.
 *
 * Library figures come from the shared context — no extra calls.
 */
export default function MainPageProfileXboxLinked({
  summary,
  isLoading,
  error,
  onRetry,
}: {
  summary: XboxSummary | null
  isLoading: boolean
  error: XboxLinkError | null
  onRetry: () => void
}) {
  const { T } = useLanguage()
  const { library, libraryLoading, refetch } = useXboxGamesData()
  const latest = useXboxRecentAchievements('recent')
  // Without the games on the consoles unticked in preferences.
  const { isGameShown } = useConsoleVisibility()
  const latestAchievements = useMemo(() => latest.achievements.filter((a) => isGameShown('xbox', a.gameId)), [latest.achievements, isGameShown])
  const subject = useSubject()

  if (isLoading) {
    return <MainPageProfileSkeleton label={T.cards.loading} />
  }

  if (error || !summary) {
    return <MainPageProfileError logo={<XboxLogo size={16} aria-hidden="true" />} title={T.xbox.profileError} detail={error ? T.xbox.errors[error] : undefined} retryLabel={T.xbox.retry} onRetry={onRetry} />
  }

  // Someone else's page has nothing of the viewer's to refresh.
  const refresh = subject
    ? undefined
    : () => {
        onRetry()
        latest.retry()
        refetch()
      }

  // The last game played that has achievements: a game with none says nothing here.
  const last = library.find(xboxHasAchievements)

  return (
    // Fills the column like the other cards, so switching tabs does not resize it.
    <div className="flex flex-col gap-3.5 w-full h-full">
      <MainPageProfileCard
        avatarSrc={summary.avatarUrl || null}
        avatarFallback={<span className="w-full h-full bg-[#107c10] flex items-center justify-center"><XboxLogo size={32} className="text-white" /></span>}
        ring="#107c10"
        name={summary.gamertag}
        actions={
          <MainPageProfileActions
            href={`https://www.xbox.com/play/user/${encodeURIComponent(summary.gamertag)}`}
            linkLabel={T.xbox.viewOnXbox}
            ringClass="focus:ring-success"
            onRefresh={refresh}
          />
        }
        stats={<MainPageProfileXboxStats summary={summary} library={library} isLoading={libraryLoading} />}
      >
        {summary.tier && (
          <span className="inline-flex items-center gap-1 text-[0.8125rem] text-text-secondary">
            {T.xbox.tier}
            <span className="px-1.5 py-0.5 rounded-[0.375rem] bg-success/15 text-success font-bold text-xs">{summary.tier}</span>
          </span>
        )}
        {summary.bio && <p className="text-[0.8125rem] text-text-secondary line-clamp-2">{summary.bio}</p>}
      </MainPageProfileCard>

      {last ? <MainPageProfileXboxGame game={last} /> : libraryLoading && <MainPageProfileGameSkeleton />}

      <MainPageProfileXboxAchievements
        achievements={latestAchievements}
        isLoading={latest.isLoading}
        error={latest.error}
        onRetry={latest.retry}
      />
    </div>
  )
}
