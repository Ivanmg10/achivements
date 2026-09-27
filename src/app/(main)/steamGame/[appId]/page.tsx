'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { notFound, useParams } from 'next/navigation'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { useSteamGameDetails } from '@/hooks/useSteamGameDetails'
import LoadingPage from '@/components/loading-page/LoadingPage'
import SteamGameHeroBackground from '@/components/steam/steam-game-hero-background/SteamGameHeroBackground'
import SteamGameInfoHeader from '@/components/steam/steam-game-info-header/SteamGameInfoHeader'
import SteamGameInfoTable from '@/components/steam/steam-game-info-table/SteamGameInfoTable'

/**
 * A Steam game's page — the counterpart of /gameInfo/[gameId] for RA, built
 * the same way: blurred artwork behind a header, then the achievement table.
 *
 * Library data (title, playtime) comes from the shared context, so opening a
 * game from a list costs no extra request; store details and achievements
 * load for the page. Opened directly, the page still works — for a game
 * outside the library it shows the store title and says it is not owned.
 */
export default function SteamGamePage() {
  const { appId: rawId } = useParams()
  const appId = typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : null
  const { T } = useLanguage()
  const { isLinked, library, libraryLoading } = useSteamGamesData()
  const { achievements, isLoading: achievementsLoading, error: achievementsError, retry } = useSteamAchievements(
    isLinked ? appId : null,
  )
  const { details, isLoading: detailsLoading } = useSteamGameDetails(isLinked ? appId : null)

  if (appId === null) notFound()

  if (!isLinked) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center text-text-main gap-3 p-6 text-center">
        <p className="text-text-secondary">Steam · {T.userData.notConnected}</p>
        <Link
          href="/user"
          className="px-4 py-1.5 bg-accent text-bg-main font-semibold rounded-xl hover:scale-[1.03] transition-transform duration-200 text-sm"
        >
          {T.userData.steamConnect}
        </Link>
      </main>
    )
  }

  const game = library.find((g) => g.id === appId) ?? null

  // Nothing to title the page with yet.
  if (!game && !details && (libraryLoading || detailsLoading)) {
    return <LoadingPage subtitle={T.loadingPage.game} />
  }

  const title = game?.title ?? details?.name ?? `App ${appId}`
  const counts =
    achievements.length > 0
      ? { earned: achievements.filter((a) => a.earned).length, total: achievements.length }
      : game?.achievementsLoaded
        ? { earned: game.numAwarded, total: game.maxPossible }
        : null

  return (
    <main className="flex-1 flex flex-col items-center text-text-main relative">
      <SteamGameHeroBackground appId={appId} />
      <motion.div className="relative w-full flex flex-col items-center" variants={fadeUp} initial="hidden" animate="visible">
        <SteamGameInfoHeader appId={appId} title={title} game={game} details={details} counts={counts} />

        {achievementsLoading ? (
          <section aria-busy="true" className="bg-bg-card p-5 rounded-xl w-[95%] mt-5 mb-5 flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-bg-main rounded-xl animate-pulse" />
            ))}
          </section>
        ) : achievementsError ? (
          <section className="bg-bg-card p-5 rounded-xl w-[95%] mt-5 mb-5 flex flex-col items-center gap-2 text-center">
            <p role="alert" className="text-red-400">
              {T.steam.achievementsError}
            </p>
            <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
            <button
              onClick={retry}
              className="text-sm bg-bg-main px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              {T.steam.retry}
            </button>
          </section>
        ) : achievements.length === 0 ? (
          <section className="bg-bg-card p-5 rounded-xl w-[95%] mt-5 mb-5 text-center">
            <p className="text-text-secondary">{T.steam.noAchievements}</p>
          </section>
        ) : (
          <SteamGameInfoTable achievements={achievements} appId={appId} gameTitle={title} />
        )}
      </motion.div>
    </main>
  )
}
