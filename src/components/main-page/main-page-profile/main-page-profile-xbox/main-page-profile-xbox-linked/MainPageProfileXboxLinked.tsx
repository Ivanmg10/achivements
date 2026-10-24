'use client'

import { useMemo } from 'react'
import Image from 'next/image'
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
    <div className="relative flex flex-col gap-3 p-3 bg-bg-card rounded-xl w-full h-full">
      <MainPageProfileActions
        href={`https://www.xbox.com/play/user/${encodeURIComponent(summary.gamertag)}`}
        linkLabel={T.xbox.viewOnXbox}
        ringClass="focus:ring-success"
        onRefresh={refresh}
      />

      <div className={`flex gap-3 items-center ${refresh ? 'pr-40' : 'pr-28'}`}>
        {summary.avatarUrl ? (
          <Image
            src={summary.avatarUrl}
            alt=""
            width={90}
            height={90}
            className="m-1 rounded-lg ring-2 ring-success shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5"
            unoptimized
          />
        ) : (
          <div
            aria-hidden="true"
            className="m-1 rounded-lg bg-[#107c10] shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5 flex items-center justify-center"
          >
            <XboxLogo size={32} className="text-white" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0 w-full">
          <p className="font-display italic font-extrabold text-3xl lg:text-4xl leading-none truncate pr-1.5">{summary.gamertag}</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {summary.tier && (
              <span className="inline-flex items-center gap-1 text-text-secondary">
                {T.xbox.tier}
                <span className="px-1.5 py-0.5 rounded bg-success/15 text-success font-semibold">{summary.tier}</span>
              </span>
            )}
          </div>
          {summary.bio && <p className="text-xs text-text-secondary line-clamp-2">{summary.bio}</p>}
        </div>
      </div>

      <MainPageProfileXboxStats summary={summary} library={library} isLoading={libraryLoading} />

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
