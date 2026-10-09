'use client'

import Image from 'next/image'
import { IconExternalLink } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import type { PsnError } from '@/hooks/usePsnLink'
import type { PsnSummary } from '@/lib/psnClient'
import MainPageProfilePsnStats from '../main-page-profile-psn-stats/MainPageProfilePsnStats'
import MainPageProfilePsnGame from '../main-page-profile-psn-game/MainPageProfilePsnGame'
import MainPageProfilePsnTrophies from '../main-page-profile-psn-trophies/MainPageProfilePsnTrophies'
import MainPageProfileSkeleton from '../../main-page-profile-skeleton/MainPageProfileSkeleton'
import MainPageProfileGameSkeleton from '../../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'

/** Sony's trophy-level tiers in groups of three: bronze, silver, gold, then platinum at 10. */
const TIER_RING = ['border-orange-400', 'border-zinc-400', 'border-yellow-400', 'border-sky-300']

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
  const { library, libraryLoading } = usePsnGamesData()
  const latest = usePsnRecentTrophies('recent')

  if (isLoading) {
    return <MainPageProfileSkeleton label={T.cards.loading} />
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-start gap-2 p-3 bg-bg-card rounded-xl w-full">
        <p role="alert" className="text-sm text-red-400">
          {T.psn.profileError}
        </p>
        {error === 'private' && <p className="text-xs text-text-secondary">{T.psn.errors.private}</p>}
        <button onClick={onRetry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
          {T.psn.retry}
        </button>
      </div>
    )
  }

  const ring = TIER_RING[Math.min(Math.floor((summary.tier - 1) / 3), 3)]

  return (
    // Fills the column like the other cards, so switching tabs does not resize it.
    <div className="relative flex flex-col gap-3 p-3 bg-bg-card rounded-xl w-full h-full">
      <a
        href={`https://profile.playstation.com/${encodeURIComponent(summary.onlineId)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/8 hover:bg-ink/12 text-text-secondary hover:text-text-main text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#0070d1]"
      >
        <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        {T.psn.viewOnPsn}
      </a>

      <div className="flex gap-3 items-center pr-28">
        {summary.avatarUrl ? (
          <Image
            src={summary.avatarUrl}
            alt=""
            width={90}
            height={90}
            className="m-1 rounded-lg ring-2 ring-[#0070d1] shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5"
            unoptimized
          />
        ) : (
          <div
            aria-hidden="true"
            className="m-1 rounded-lg bg-[#003791] shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5 flex items-center justify-center"
          >
            <PlaystationLogo size={32} className="text-white" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0 w-full">
          <p className="text-xl lg:text-2xl font-bold leading-tight truncate">{summary.onlineId}</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1 text-text-secondary">
              {T.psn.level}
              <span
                className={`inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full border-2 ${ring} text-text-main font-bold tabular-nums`}
              >
                {summary.trophyLevel}
              </span>
            </span>
            {summary.isPlus && (
              <span className="px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-400 font-semibold">PS Plus</span>
            )}
          </div>
          {summary.aboutMe && <p className="text-xs text-text-secondary line-clamp-2">{summary.aboutMe}</p>}
        </div>
      </div>

      <MainPageProfilePsnStats summary={summary} library={library} isLoading={libraryLoading} />

      {library[0] ? <MainPageProfilePsnGame game={library[0]} /> : libraryLoading && <MainPageProfileGameSkeleton />}

      <MainPageProfilePsnTrophies
        trophies={latest.trophies}
        isLoading={latest.isLoading}
        error={latest.error}
        onRetry={latest.retry}
      />
    </div>
  )
}
