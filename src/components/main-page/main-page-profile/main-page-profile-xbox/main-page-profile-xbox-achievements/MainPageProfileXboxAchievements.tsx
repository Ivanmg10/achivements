'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import EmptyState from '@/components/empty-state/EmptyState'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxLinkError } from '@/hooks/useXboxLink'
import type { XboxRecentAchievement } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'

/**
 * The player's latest achievements — the PSN list's counterpart, same layout,
 * with the gamerscore under the name. Each opens that achievement on its game
 * page.
 */
export default function MainPageProfileXboxAchievements({
  achievements,
  isLoading,
  error,
  onRetry,
}: {
  achievements: XboxRecentAchievement[]
  isLoading: boolean
  error: XboxLinkError | null
  onRetry: () => void
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  return (
    <div className="bg-bg-main rounded-lg p-3 flex flex-col gap-2 flex-1 min-h-[104px]">
      <p className="text-xs text-text-secondary uppercase tracking-wider">{T.xbox.recentAchievements}</p>
      {isLoading && achievements.length === 0 ? (
        <div aria-busy="true" className="flex flex-col gap-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center p-1">
              <div className="w-9 h-9 rounded bg-ink/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-2.5 bg-ink/10 rounded w-3/4" />
                <div className="h-2 bg-ink/10 rounded w-1/2" />
              </div>
              <div className="w-8 h-3 bg-ink/10 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2 flex-1 justify-center">
          <p role="alert" className="text-sm text-danger">
            {T.xbox.achievementsError}
          </p>
          <button onClick={onRetry} className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
            {T.xbox.retry}
          </button>
        </div>
      ) : achievements.length === 0 ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.cards.noEarned} size="compact" className="flex-1" />
      ) : (
        // A full-width column that wraps: a row that does not fit moves to a
        // second column, out of sight — so the list shows whole rows only,
        // as many as the profile column has room for, and never scrolls.
        <ol className="flex flex-col flex-wrap gap-x-4 gap-y-2 flex-1 min-h-0 overflow-hidden">
          {achievements.slice(0, 3).map((a) => (
            <li key={`${a.gameId}:${a.achievementId}`} className="w-full">
              <Link
                href={`${gameHref('xbox', a.gameId, subject)}#${xboxAchievementAnchor(a.achievementId)}`}
                className="flex gap-2 items-center rounded-lg hover:bg-ink/5 transition-colors group p-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                {a.iconUrl ? (
                  <Image src={a.iconUrl} alt="" width={36} height={36} className="w-9 h-9 rounded object-cover shrink-0" unoptimized />
                ) : (
                  <div className="w-9 h-9 rounded bg-ink/10 shrink-0" aria-hidden="true" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{a.name}</span>
                  <span className="text-xs text-text-secondary truncate">
                    <span className="text-green-500">{a.gamerscore} G</span> · {a.gameTitle}
                  </span>
                </div>
                <time dateTime={a.earnedAt} className="text-xs ml-auto shrink-0 text-green-500">
                  {new Date(a.earnedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                </time>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
