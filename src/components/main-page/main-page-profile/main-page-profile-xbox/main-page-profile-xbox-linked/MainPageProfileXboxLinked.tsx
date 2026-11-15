'use client'

import { useMemo } from 'react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'
import type { XboxLinkError } from '@/hooks/useXboxLink'
import { xboxHasAchievements } from '@/utils/xboxTitles'
import type { XboxSummary } from '@/types/xbox'
import MainPageProfileLinked from '../../main-page-profile-linked/MainPageProfileLinked'
import MainPageProfileXboxStats from '../main-page-profile-xbox-stats/MainPageProfileXboxStats'
import MainPageProfileXboxGame from '../main-page-profile-xbox-game/MainPageProfileXboxGame'
import MainPageProfileXboxAchievements from '../main-page-profile-xbox-achievements/MainPageProfileXboxAchievements'
import MainPageProfileGameSkeleton from '../../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import Tag from '@/components/ui/Tag'

/**
 * A linked Xbox profile: header (avatar, gamertag, tier, bio, link out), four stats, the last game
 * played with its progress, and the latest achievements. Library figures come from the shared context
 * — no extra calls.
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

  if (error || !summary) {
    return (
      <MainPageProfileLinked
        isLoading={isLoading}
        failure={{ logo: <XboxLogo size={16} aria-hidden="true" />, title: T.xbox.profileError, detail: error ? T.xbox.errors[error] : undefined, retryLabel: T.xbox.retry, onRetry }}
      />
    )
  }

  // The last game played that has achievements: a game with none says nothing here.
  const last = library.find(xboxHasAchievements)

  return (
    <MainPageProfileLinked
      isLoading={isLoading}
      onRefresh={() => {
        onRetry()
        latest.retry()
        refetch()
      }}
      card={{
        avatarSrc: summary.avatarUrl || null,
        avatarFallback: <span className="w-full h-full bg-xbox flex items-center justify-center"><XboxLogo size={32} className="text-white" /></span>,
        ring: 'var(--color-xbox)',
        name: summary.gamertag,
        link: { href: `https://www.xbox.com/play/user/${encodeURIComponent(summary.gamertag)}`, label: T.xbox.viewOnXbox, ringClass: 'focus:ring-success' },
        stats: <MainPageProfileXboxStats summary={summary} library={library} isLoading={libraryLoading} />,
        children: (
          <>
            {summary.tier && (
              <span className="inline-flex items-center gap-1 text-[0.8125rem] text-text-secondary">
                {T.xbox.tier}
                <Tag tone="success">{summary.tier}</Tag>
              </span>
            )}
            {summary.bio && <p className="text-[0.8125rem] text-text-secondary line-clamp-2">{summary.bio}</p>}
          </>
        ),
      }}
      game={last ? <MainPageProfileXboxGame game={last} /> : libraryLoading && <MainPageProfileGameSkeleton />}
      recent={<MainPageProfileXboxAchievements achievements={latestAchievements} isLoading={latest.isLoading} error={latest.error} onRetry={latest.retry} />}
    />
  )
}
