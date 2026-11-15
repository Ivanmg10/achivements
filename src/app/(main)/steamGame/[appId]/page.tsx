'use client'

import { notFound, useParams } from 'next/navigation'
import { GAME_COLUMN } from '@/components/game-page-states/gameSectionWidth'
import { useLanguage } from '@/context/LanguageContext'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { useSteamGameDetails } from '@/hooks/useSteamGameDetails'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GamePageNotLinked from '@/components/game-page-states/game-page-not-linked/GamePageNotLinked'
import GameTableState from '@/components/game-page-states/game-table-state/GameTableState'
import SteamGameHeroBackground from '@/components/steam/steam-game-hero-background/SteamGameHeroBackground'
import SteamGameInfoHeader from '@/components/steam/steam-game-info-header/SteamGameInfoHeader'
import SteamGameInfoTable from '@/components/steam/steam-game-info-table/SteamGameInfoTable'
import GameAiExport from '@/components/game-ai-export/GameAiExport'
import { steamAiSource } from '@/utils/aiExport'

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
  const { status } = useAuthSession()
  const { isLinked, fullLibrary, libraryLoading } = useSteamGamesData()
  const { achievements, isLoading: achievementsLoading, error: achievementsError, retry } = useSteamAchievements(
    isLinked ? appId : null,
  )
  const { details, isLoading: detailsLoading } = useSteamGameDetails(isLinked ? appId : null)

  if (appId === null) notFound()
  if (status === 'loading') return <GameInfoSkeleton />
  if (!isLinked) return <GamePageNotLinked platform="Steam" connectLabel={T.userData.steamConnect} />

  const game = fullLibrary.find((g) => g.id === appId) ?? null

  // Nothing to title the page with yet.
  if (!game && !details && (libraryLoading || detailsLoading)) {
    return <GameInfoSkeleton />
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
      <div className={GAME_COLUMN}>
        <SteamGameInfoHeader
          appId={appId}
          title={title}
          game={game}
          details={details}
          counts={counts}
          actions={
            achievements.length > 0 && (
              <GameAiExport
                getSource={() => steamAiSource({ appId, title, achievements, details, playtimeMinutes: game?.playtimeForever ?? null })}
              />
            )
          }
        />
        <GameTableState
          isLoading={achievementsLoading}
          failed={Boolean(achievementsError)}
          errorText={T.steam.achievementsError}
          hint={T.steam.privateProfileHint}
          retryLabel={T.steam.retry}
          onRetry={retry}
          emptyText={T.steam.noAchievements}
          isEmpty={achievements.length === 0}
        >
          <SteamGameInfoTable achievements={achievements} appId={appId} gameTitle={title} />
        </GameTableState>
      </div>
    </main>
  )
}
