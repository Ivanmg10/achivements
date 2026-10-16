'use client'

import Image from 'next/image'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import type { XboxLinkError } from '@/hooks/useXboxLink'
import { xboxHasAchievements } from '@/utils/xboxTitles'
import type { XboxSummary } from '@/types/xbox'
import MainPageProfileActions from '../../main-page-profile-actions/MainPageProfileActions'
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
  const subject = useSubject()

  if (isLoading) {
    return <MainPageProfileSkeleton label={T.cards.loading} />
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-start gap-2 p-3 bg-bg-card rounded-xl w-full">
        <p role="alert" className="text-sm text-red-400">
          {T.xbox.profileError}
        </p>
        {error && <p className="text-xs text-text-secondary">{T.xbox.errors[error]}</p>}
        <button onClick={onRetry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
          {T.xbox.retry}
        </button>
      </div>
    )
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
        ringClass="focus:ring-green-500"
        onRefresh={refresh}
      />

      <div className={`flex gap-3 items-center ${refresh ? 'pr-40' : 'pr-28'}`}>
        {summary.avatarUrl ? (
          <Image
            src={summary.avatarUrl}
            alt=""
            width={90}
            height={90}
            className="m-1 rounded-lg ring-2 ring-green-500 shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5"
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
          <p className="text-xl lg:text-2xl font-bold leading-tight truncate">{summary.gamertag}</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {summary.tier && (
              <span className="inline-flex items-center gap-1 text-text-secondary">
                {T.xbox.tier}
                <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-semibold">{summary.tier}</span>
              </span>
            )}
          </div>
          {summary.bio && <p className="text-xs text-text-secondary line-clamp-2">{summary.bio}</p>}
        </div>
      </div>

      <MainPageProfileXboxStats summary={summary} library={library} isLoading={libraryLoading} />

      {last ? <MainPageProfileXboxGame game={last} /> : libraryLoading && <MainPageProfileGameSkeleton />}

      <MainPageProfileXboxAchievements
        achievements={latest.achievements}
        isLoading={latest.isLoading}
        error={latest.error}
        onRetry={latest.retry}
      />
    </div>
  )
}
