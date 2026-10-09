'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import EmptyState from '@/components/empty-state/EmptyState'
import { gameHref } from '@/utils/gameRef'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import type { PsnError } from '@/hooks/usePsnLink'
import type { PsnRecentTrophy } from '@/types/psn'

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
  const grade = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }

  return (
    <div className="bg-bg-main rounded-lg p-3 flex flex-col gap-2 flex-1 min-h-[104px]">
      <p className="text-xs text-text-secondary uppercase tracking-wider">{T.psn.recentTrophies}</p>
      {isLoading && trophies.length === 0 ? (
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
          <p role="alert" className="text-sm text-red-400">
            {T.psn.trophiesError}
          </p>
          <button onClick={onRetry} className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
            {T.psn.retry}
          </button>
        </div>
      ) : trophies.length === 0 ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.cards.noEarned} size="compact" className="flex-1" />
      ) : (
        // A full-width column that wraps: a row that does not fit moves to a
        // second column, out of sight — so the list shows whole rows only,
        // as many as the profile column has room for, and never scrolls.
        <ol className="flex flex-col flex-wrap gap-x-4 gap-y-2 flex-1 min-h-0 overflow-hidden">
          {trophies.slice(0, 3).map((t) => (
            <li key={`${t.gameId}:${t.trophyId}`} className="w-full">
              <Link
                href={`${gameHref('psn', t.gameId)}#${psnTrophyAnchor(t.trophyId)}`}
                className="flex gap-2 items-center rounded-lg hover:bg-ink/5 transition-colors group p-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1]"
              >
                {t.iconUrl ? (
                  <Image src={t.iconUrl} alt="" width={36} height={36} className="w-9 h-9 rounded object-cover shrink-0" unoptimized />
                ) : (
                  <div className="w-9 h-9 rounded bg-ink/10 shrink-0" aria-hidden="true" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{t.name}</span>
                  <span className="text-xs text-text-secondary truncate">
                    <span className={TROPHY_GRADE_COLOR[t.type]}>{grade[t.type]}</span> · {t.gameTitle}
                  </span>
                </div>
                <time dateTime={t.earnedAt} className="text-xs ml-auto shrink-0 text-[#0070d1]">
                  {new Date(t.earnedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}
                </time>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
