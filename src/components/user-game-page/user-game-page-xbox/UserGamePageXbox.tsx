'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { useXboxGameDetails } from '@/hooks/useXboxGameDetails'
import { xboxBackdrop } from '@/utils/xboxTitles'
import { xboxCompareList } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import XboxGameHeroBackground from '@/components/xbox/xbox-game-hero-background/XboxGameHeroBackground'
import XboxGameInfoHeader from '@/components/xbox/xbox-game-info-header/XboxGameInfoHeader'
import XboxPartialListNote from '@/components/xbox/xbox-partial-list-note/XboxPartialListNote'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import UserGameCompareBody from '@/components/user-game-page/user-game-compare-body/UserGameCompareBody'
import UserGameNotInList from '@/components/user-game-page/user-game-not-in-list/UserGameNotInList'
import type { UserGamePlatformProps } from '@/types/userGamePage'

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
  if (!game) return <UserGameNotInList banner={banner} username={username} />

  return (
    <UserGameCompareBody
      background={<XboxGameHeroBackground src={details?.heroUrl ?? xboxBackdrop(game)} />}
      banner={banner}
      header={<XboxGameInfoHeader game={game} details={details} />}
      username={username}
      isLoading={isLoading}
      failed={Boolean(error)}
      hint={error === 'private' ? T.xbox.errors.private : null}
      onRetry={retry}
    >
      <XboxPartialListNote game={game} listed={achievements.length} />
      <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
    </UserGameCompareBody>
  )
}
