'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import EmptyState from '@/components/empty-state/EmptyState'
import type { SteamRecentAchievement } from '@/types/steam'

/**
 * The player's latest Steam unlocks — MainPageProfileRaAchievements'
 * counterpart, same layout. Steam has no points, so the unlock date takes the
 * right-hand slot. Each opens that achievement on its game page.
 */
export default function MainPageProfileStAchievements({
  achievements,
  isLoading,
  error,
  onRetry,
}: {
  achievements: SteamRecentAchievement[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
}) {
  const { T, lang } = useLanguage()

  return (
    <div className="bg-bg-main rounded-lg p-3 flex flex-col gap-2 min-h-[220px]">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{T.profileAchievements.recentAchievements}</p>
      {isLoading && achievements.length === 0 ? (
        <div aria-busy="true" className="flex flex-col gap-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center p-1">
              <div className="w-9 h-9 rounded bg-white/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-2.5 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
              </div>
              <div className="w-8 h-3 bg-white/10 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2 flex-1 justify-center">
          <p role="alert" className="text-sm text-red-400">
            {T.steam.achievementsError}
          </p>
          <button
            onClick={onRetry}
            className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
          >
            {T.steam.retry}
          </button>
        </div>
      ) : achievements.length === 0 ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.cards.noEarned} size="compact" className="flex-1" />
      ) : (
        <ol className="flex flex-col gap-2">
          {achievements.slice(0, 5).map((a) => (
            <li key={`${a.appId}:${a.apiname}`}>
              <Link
                href={`/steamGame/${a.appId}#${achievementAnchor(a.apiname)}`}
                className="flex gap-2 items-center rounded-lg hover:bg-white/5 transition-colors group p-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
              >
                {a.badgeUrl ? (
                  <Image src={a.badgeUrl} alt="" width={36} height={36} className="rounded shrink-0" unoptimized />
                ) : (
                  <div className="w-9 h-9 rounded bg-white/10 shrink-0" aria-hidden="true" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{a.title}</span>
                  <span className="text-xs text-gray-500 truncate">{a.gameTitle}</span>
                </div>
                <time dateTime={a.unlockedAt} className="text-xs ml-auto shrink-0 text-[#66c0f4]">
                  {new Date(a.unlockedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                </time>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
