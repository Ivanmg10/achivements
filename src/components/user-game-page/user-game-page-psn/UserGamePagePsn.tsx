'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { usePsnGameDetails } from '@/hooks/usePsnGameDetails'
import { psnBackdrop } from '@/utils/psnTitles'
import { psnCompareList } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import PsnGameHeroBackground from '@/components/psn/psn-game-hero-background/PsnGameHeroBackground'
import PsnGameInfoHeader from '@/components/psn/psn-game-info-header/PsnGameInfoHeader'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import UserGameCompareBody from '@/components/user-game-page/user-game-compare-body/UserGameCompareBody'
import UserGameNotInList from '@/components/user-game-page/user-game-not-in-list/UserGameNotInList'
import type { UserGamePlatformProps } from '@/types/userGamePage'

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
  if (!game) return <UserGameNotInList banner={banner} username={username} />

  return (
    <UserGameCompareBody
      background={<PsnGameHeroBackground src={psnBackdrop(game)} />}
      banner={banner}
      header={<PsnGameInfoHeader game={game} details={details} />}
      username={username}
      isLoading={isLoading}
      failed={Boolean(error)}
      hint={error === 'private' ? T.psn.errors.private : null}
      onRetry={retry}
    >
      <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
    </UserGameCompareBody>
  )
}
