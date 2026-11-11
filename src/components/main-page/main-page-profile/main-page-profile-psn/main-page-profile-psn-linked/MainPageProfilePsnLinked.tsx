'use client'

import { useMemo } from 'react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'
import type { PsnError } from '@/hooks/usePsnLink'
import type { PsnSummary } from '@/lib/psnClient'
import MainPageProfileLinked from '../../main-page-profile-linked/MainPageProfileLinked'
import MainPageProfilePsnStats from '../main-page-profile-psn-stats/MainPageProfilePsnStats'
import MainPageProfilePsnGame from '../main-page-profile-psn-game/MainPageProfilePsnGame'
import MainPageProfilePsnTrophies from '../main-page-profile-psn-trophies/MainPageProfilePsnTrophies'
import MainPageProfileGameSkeleton from '../../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import Tag from '@/components/ui/Tag'

/** Sony's trophy-level tiers in groups of three: bronze, silver, gold, then platinum at 10. */
const TIER_RING = ['border-warning', 'border-silver', 'border-hardcore', 'border-platinum']

/**
 * A linked PSN profile: header (avatar, name, trophy level, PS Plus, about me, link out), four stats,
 * the last game played with its progress, and the latest trophies. Library figures come from the
 * shared context — no extra calls.
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

  if (error || !summary) {
    return (
      <MainPageProfileLinked
        isLoading={isLoading}
        failure={{ logo: <PlaystationLogo size={16} aria-hidden="true" />, title: T.psn.profileError, detail: error === 'private' ? T.psn.errors.private : undefined, retryLabel: T.psn.retry, onRetry }}
      />
    )
  }

  const ring = TIER_RING[Math.min(Math.floor((summary.tier - 1) / 3), 3)]

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
        avatarFallback: <span className="w-full h-full bg-psn-dark flex items-center justify-center"><PlaystationLogo size={32} className="text-white" /></span>,
        ring: 'var(--color-psn)',
        name: summary.onlineId,
        link: { href: `https://profile.playstation.com/${encodeURIComponent(summary.onlineId)}`, label: T.psn.viewOnPsn, ringClass: 'focus:ring-psn' },
        stats: <MainPageProfilePsnStats summary={summary} library={library} isLoading={libraryLoading} />,
        children: (
          <>
            <div className="flex items-center gap-2 flex-wrap text-[0.8125rem] text-text-secondary">
              <span className="inline-flex items-center gap-1">
                {T.psn.level}
                <span className={`inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full border-2 ${ring} text-text-main font-bold tabular-nums`}>
                  {summary.trophyLevel}
                </span>
              </span>
              {summary.isPlus && <Tag tone="hardcore">PS Plus</Tag>}
            </div>
            {summary.aboutMe && <p className="text-[0.8125rem] text-text-secondary line-clamp-2">{summary.aboutMe}</p>}
          </>
        ),
      }}
      game={library[0] ? <MainPageProfilePsnGame game={library[0]} /> : libraryLoading && <MainPageProfileGameSkeleton />}
      recent={<MainPageProfilePsnTrophies trophies={latestTrophies} isLoading={latest.isLoading} error={latest.error} onRetry={latest.retry} />}
    />
  )
}
