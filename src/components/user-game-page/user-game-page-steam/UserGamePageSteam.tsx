'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { useSteamGameDetails } from '@/hooks/useSteamGameDetails'
import { fadeUp } from '@/lib/animations'
import { steamCompareList } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoSkeletonTable from '@/components/game-info-skeleton/game-info-skeleton-table/GameInfoSkeletonTable'
import SteamGameHeroBackground from '@/components/steam/steam-game-hero-background/SteamGameHeroBackground'
import SteamGameInfoHeader from '@/components/steam/steam-game-info-header/SteamGameInfoHeader'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import type { UserGamePlatformProps } from '../user-game-page-ra/UserGamePageRa'
import { buttonClass } from '@/components/ui/Button'

/** A Steam game as a user has it (read inside SubjectProviders): the Steam page's header, then the comparison table. */
export default function UserGamePageSteam({ id, username, banner, comparing, mine, mineLoading, notice }: UserGamePlatformProps) {
  const { T } = useLanguage()
  const appId = Number(id)
  const { library, libraryLoading } = useSteamGamesData()
  const { achievements, isLoading, error, retry } = useSteamAchievements(appId)
  const { details, isLoading: detailsLoading } = useSteamGameDetails(appId)
  const theirs = useMemo(() => steamCompareList(achievements), [achievements])

  const game = library.find((g) => g.id === appId) ?? null
  if (!game && !details && (libraryLoading || detailsLoading)) return <GameInfoSkeleton />

  const title = game?.title ?? details?.name ?? `App ${appId}`
  const counts =
    achievements.length > 0
      ? { earned: achievements.filter((a) => a.earned).length, total: achievements.length }
      : game?.achievementsLoaded
        ? { earned: game.numAwarded, total: game.maxPossible }
        : null

  return (
    <>
      <SteamGameHeroBackground appId={appId} />
      {banner}
      <motion.div className="relative w-full flex flex-col items-center" variants={fadeUp} initial="hidden" animate="visible">
        <SteamGameInfoHeader appId={appId} title={title} game={game} details={details} counts={counts} />
        <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-7 mb-7">
          {isLoading ? (
            <div role="status" aria-busy="true" className="w-full flex flex-col items-center">
              <span className="sr-only">{T.loadingPage.game}</span>
              <GameInfoSkeletonTable />
            </div>
          ) : error ? (
            <section className="bg-bg-card p-5 rounded-tile flex flex-col items-center gap-2 text-center">
              <p role="alert" className="text-danger">{T.userGame.loadError.replace('{u}', username)}</p>
              <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
              <button onClick={retry} className={buttonClass('secondary', 'sm')}>
                {T.publicProfile.retry}
              </button>
            </section>
          ) : (
            <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
          )}
        </div>
      </motion.div>
    </>
  )
}
