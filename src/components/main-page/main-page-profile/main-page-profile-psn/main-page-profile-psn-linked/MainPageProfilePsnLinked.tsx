'use client'

import { useMemo } from 'react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'
import type { PsnError } from '@/hooks/usePsnLink'
import type { PsnSummary } from '@/lib/psnClient'
import MainPageProfileActions from '../../main-page-profile-actions/MainPageProfileActions'
import MainPageProfileError from '../../main-page-profile-error/MainPageProfileError'
import MainPageProfilePsnStats from '../main-page-profile-psn-stats/MainPageProfilePsnStats'
import MainPageProfilePsnGame from '../main-page-profile-psn-game/MainPageProfilePsnGame'
import MainPageProfilePsnTrophies from '../main-page-profile-psn-trophies/MainPageProfilePsnTrophies'
import MainPageProfileSkeleton from '../../main-page-profile-skeleton/MainPageProfileSkeleton'
import MainPageProfileGameSkeleton from '../../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import MainPageProfileCard from '../../main-page-profile-card/MainPageProfileCard'

/** Sony's trophy-level tiers in groups of three: bronze, silver, gold, then platinum at 10. */
const TIER_RING = ['border-warning', 'border-zinc-400', 'border-hardcore', 'border-sky-300']

/**
 * A linked PSN profile, built like the Steam one block for block: header
 * (avatar, name, trophy level, PS Plus, about me, link out), four stats, the
 * last game played with its progress, and the latest trophies.
 *
 * Library figures come from the shared context — no extra calls.
 */
export default function MainPageProfilePsnLinked({
  summary,
  isLoading,
  error,
  onRetry,
}: {
  summary: PsnSummary | null
  isLoading: boolean
  error: PsnError | null
  onRetry: () => void
}) {
  const { T } = useLanguage()
  const { library, libraryLoading, refetch } = usePsnGamesData()
  const latest = usePsnRecentTrophies('recent')
  // Without the games on the consoles unticked in preferences.
  const { isGameShown } = useConsoleVisibility()
  const latestTrophies = useMemo(() => latest.trophies.filter((t) => isGameShown('psn', t.gameId)), [latest.trophies, isGameShown])
  const subject = useSubject()

  if (isLoading) {
    return <MainPageProfileSkeleton label={T.cards.loading} />
  }

  if (error || !summary) {
    return <MainPageProfileError logo={<PlaystationLogo size={16} aria-hidden="true" />} title={T.psn.profileError} detail={error === 'private' ? T.psn.errors.private : undefined} retryLabel={T.psn.retry} onRetry={onRetry} />
  }

  // Someone else's page has nothing of the viewer's to refresh.
  const refresh = subject
    ? undefined
    : () => {
        onRetry()
        latest.retry()
        refetch()
      }

  const ring = TIER_RING[Math.min(Math.floor((summary.tier - 1) / 3), 3)]

  return (
    // Fills the column like the other cards, so switching tabs does not resize it.
    <div className="flex flex-col gap-3.5 w-full h-full">
      <MainPageProfileCard
        avatarSrc={summary.avatarUrl || null}
        avatarFallback={<span className="w-full h-full bg-[#003791] flex items-center justify-center"><PlaystationLogo size={32} className="text-white" /></span>}
        ring="#0070d1"
        name={summary.onlineId}
        actions={
          <MainPageProfileActions
            href={`https://profile.playstation.com/${encodeURIComponent(summary.onlineId)}`}
            linkLabel={T.psn.viewOnPsn}
            ringClass="focus:ring-[#0070d1]"
            onRefresh={refresh}
          />
        }
        stats={<MainPageProfilePsnStats summary={summary} library={library} isLoading={libraryLoading} />}
      >
        <div className="flex items-center gap-2 flex-wrap text-[0.8125rem] text-text-secondary">
          <span className="inline-flex items-center gap-1">
            {T.psn.level}
            <span className={`inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full border-2 ${ring} text-text-main font-bold tabular-nums`}>
              {summary.trophyLevel}
            </span>
          </span>
          {summary.isPlus && <span className="px-1.5 py-0.5 rounded-tag bg-hardcore/15 text-hardcore font-bold text-xs">PS Plus</span>}
        </div>
        {summary.aboutMe && <p className="text-[0.8125rem] text-text-secondary line-clamp-2">{summary.aboutMe}</p>}
      </MainPageProfileCard>

      {library[0] ? <MainPageProfilePsnGame game={library[0]} /> : libraryLoading && <MainPageProfileGameSkeleton />}

      <MainPageProfilePsnTrophies
        trophies={latestTrophies}
        isLoading={latest.isLoading}
        error={latest.error}
        onRetry={latest.retry}
      />
    </div>
  )
}
