'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { useXboxGameDetails } from '@/hooks/useXboxGameDetails'
import { fadeUp } from '@/lib/animations'
import { xboxBackdrop } from '@/utils/xboxTitles'
import { xboxCompareList } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoSkeletonTable from '@/components/game-info-skeleton/game-info-skeleton-table/GameInfoSkeletonTable'
import XboxGameHeroBackground from '@/components/xbox/xbox-game-hero-background/XboxGameHeroBackground'
import XboxGameInfoHeader from '@/components/xbox/xbox-game-info-header/XboxGameInfoHeader'
import XboxPartialListNote from '@/components/xbox/xbox-partial-list-note/XboxPartialListNote'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import type { UserGamePlatformProps } from '../user-game-page-ra/UserGamePageRa'

/**
 * An Xbox game as a user has it (read inside SubjectProviders): the Xbox page's
 * header, then the comparison table. A game outside their library has nothing
 * of theirs to show.
 */
export default function UserGamePageXbox({ id, username, banner, comparing, mine, mineLoading, notice }: UserGamePlatformProps) {
  const { T } = useLanguage()
  const { library, libraryLoading } = useXboxGamesData()
  const { achievements, isLoading, error, retry } = useXboxAchievements(id)
  const { details } = useXboxGameDetails(id)
  const theirs = useMemo(() => xboxCompareList(achievements), [achievements])

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
      <XboxGameHeroBackground src={details?.heroUrl ?? xboxBackdrop(game)} />
      {banner}
      <motion.div className="relative w-full flex flex-col items-center" variants={fadeUp} initial="hidden" animate="visible">
        <XboxGameInfoHeader game={game} details={details} />
        <div className="w-[95%] mt-5 mb-5">
          {isLoading ? (
            <div role="status" aria-busy="true" className="w-full flex flex-col items-center">
              <span className="sr-only">{T.loadingPage.game}</span>
              <GameInfoSkeletonTable />
            </div>
          ) : error ? (
            <section className="bg-bg-card p-5 rounded-xl flex flex-col items-center gap-2 text-center">
              <p role="alert" className="text-red-400">{T.userGame.loadError.replace('{u}', username)}</p>
              {error === 'private' && <p className="text-xs text-text-secondary">{T.xbox.errors.private}</p>}
              <button onClick={retry} className="text-sm bg-bg-main px-4 py-1.5 rounded-full hover:bg-ink/10 transition-colors">
                {T.publicProfile.retry}
              </button>
            </section>
          ) : (
            <>
              <XboxPartialListNote game={game} listed={achievements.length} />
              <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
