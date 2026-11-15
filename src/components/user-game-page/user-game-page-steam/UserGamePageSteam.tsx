'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { useSteamGameDetails } from '@/hooks/useSteamGameDetails'
import { steamCompareList } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import SteamGameHeroBackground from '@/components/steam/steam-game-hero-background/SteamGameHeroBackground'
import SteamGameInfoHeader from '@/components/steam/steam-game-info-header/SteamGameInfoHeader'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import UserGameCompareBody from '@/components/user-game-page/user-game-compare-body/UserGameCompareBody'
import type { UserGamePlatformProps } from '@/types/userGamePage'

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
    <UserGameCompareBody
      background={<SteamGameHeroBackground appId={appId} />}
      banner={banner}
      header={<SteamGameInfoHeader appId={appId} title={title} game={game} details={details} counts={counts} />}
      username={username}
      isLoading={isLoading}
      failed={Boolean(error)}
      hint={T.steam.privateProfileHint}
      onRetry={retry}
    >
      <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
    </UserGameCompareBody>
  )
}
