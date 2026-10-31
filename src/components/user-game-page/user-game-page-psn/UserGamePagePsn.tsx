'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { usePsnGameDetails } from '@/hooks/usePsnGameDetails'
import { psnBackdrop } from '@/utils/psnTitles'
import { psnCompareList } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoSkeletonTable from '@/components/game-info-skeleton/game-info-skeleton-table/GameInfoSkeletonTable'
import PsnGameHeroBackground from '@/components/psn/psn-game-hero-background/PsnGameHeroBackground'
import PsnGameInfoHeader from '@/components/psn/psn-game-info-header/PsnGameInfoHeader'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import type { UserGamePlatformProps } from '../user-game-page-ra/UserGamePageRa'
import { buttonClass } from '@/components/ui/Button'

/**
 * A PSN game as a user has it (read inside SubjectProviders): the PSN page's
 * header, then the comparison table. A game outside their trophy list has
 * nothing of theirs to show.
 */
export default function UserGamePagePsn({ id, username, banner, comparing, mine, mineLoading, notice }: UserGamePlatformProps) {
  const { T } = useLanguage()
  const { library, libraryLoading } = usePsnGamesData()
  const { trophies, isLoading, error, retry } = usePsnTrophies(id)
  const { details } = usePsnGameDetails(id)
  const theirs = useMemo(() => psnCompareList(trophies), [trophies])

  const game = library.find((g) => g.titleId === id) ?? null
  if (!game && libraryLoading) return <GameInfoSkeleton />
  if (!game) {
    return (
      <>
        {banner}
        <p role="alert" className="relative mt-10 text-sm text-text-secondary">{T.userGame.notInTheirList.replace('{u}', username)}</p>
      </>
    )
  }

  return (
    <>
      <PsnGameHeroBackground src={psnBackdrop(game)} />
      {banner}
      <div className="relative w-full flex flex-col items-center">
        <PsnGameInfoHeader game={game} details={details} />
        <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-7 mb-7">
          {isLoading ? (
            <div role="status" aria-busy="true" className="w-full flex flex-col items-center">
              <span className="sr-only">{T.loadingPage.game}</span>
              <GameInfoSkeletonTable />
            </div>
          ) : error ? (
            <section className="bg-bg-card p-5 rounded-tile flex flex-col items-center gap-2 text-center">
              <p role="alert" className="text-danger">{T.userGame.loadError.replace('{u}', username)}</p>
              {error === 'private' && <p className="text-xs text-text-secondary">{T.psn.errors.private}</p>}
              <button onClick={retry} className={buttonClass('secondary', 'sm')}>
                {T.publicProfile.retry}
              </button>
            </section>
          ) : (
            <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
          )}
        </div>
      </div>
    </>
  )
}
