'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useGameProgression } from '@/hooks/useGameProgression'
import { raCompareList } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoHeroBackground from '@/components/game-info-hero-background/GameInfoHeroBackground'
import GameInfoHeader from '@/components/game-info-header/GameInfoHeader'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import Button from '@/components/ui/Button'
import { SURFACE } from '@/components/ui/surface'
import UserGameCompareBody from '@/components/user-game-page/user-game-compare-body/UserGameCompareBody'
import { GAME_SECTION_WIDTH } from '@/components/game-page-states/gameSectionWidth'
import type { UserGamePlatformProps } from '@/types/userGamePage'

/** An RA game as a user has it (read inside SubjectProviders): the RA page's header, then the comparison table. */
export default function UserGamePageRa({ id, username, banner, comparing, mine, mineLoading, notice }: UserGamePlatformProps) {
  const { T } = useLanguage()
  const { game, error, refetch } = useGameProgression(id)
  const current = game && String(game.ID) === id ? game : null
  const theirs = useMemo(() => raCompareList(current), [current])

  if (error) {
    return (
      <>
        {banner}
        <section className={`${SURFACE} p-6 ${GAME_SECTION_WIDTH} mt-7 flex flex-col items-center gap-2 text-center`}>
          <p role="alert" className="text-danger">{T.userGame.loadError.replace('{u}', username)}</p>
          <Button variant="secondary" size="sm" onClick={refetch}>
            {T.publicProfile.retry}
          </Button>
        </section>
      </>
    )
  }

  if (!current) return <GameInfoSkeleton />

  return (
    <UserGameCompareBody
      background={<GameInfoHeroBackground imagePath={current.ImageTitle ?? current.ImageIngame ?? null} />}
      banner={banner}
      header={<GameInfoHeader gameData={current} />}
      username={username}
    >
      <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
    </UserGameCompareBody>
  )
}
