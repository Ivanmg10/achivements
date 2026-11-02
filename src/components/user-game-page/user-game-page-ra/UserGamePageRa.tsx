'use client'

import { useMemo, type ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useGameProgression } from '@/hooks/useGameProgression'
import { raCompareList, type CompareAchievement } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoHeroBackground from '@/components/game-info-hero-background/GameInfoHeroBackground'
import GameInfoHeader from '@/components/game-info-header/GameInfoHeader'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'
import { buttonClass } from '@/components/ui/Button'

export type UserGamePlatformProps = {
  /** The game as its URL has it. */
  id: string
  username: string
  banner: ReactNode
  comparing: boolean
  mine: CompareAchievement[] | null
  mineLoading: boolean
  notice?: ReactNode
}

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
        <section className="bg-bg-card rounded-card ring-1 ring-ink/[0.06] p-6 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-7 flex flex-col items-center gap-2 text-center">
          <p role="alert" className="text-danger">{T.userGame.loadError.replace('{u}', username)}</p>
          <button onClick={refetch} className={buttonClass('secondary', 'sm')}>
            {T.publicProfile.retry}
          </button>
        </section>
      </>
    )
  }

  if (!current) return <GameInfoSkeleton />

  return (
    <>
      <GameInfoHeroBackground imagePath={current.ImageTitle ?? current.ImageIngame ?? null} />
      {banner}
      <div className="relative w-full flex flex-col items-center">
        <GameInfoHeader gameData={current} />
        <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-7 mb-7">
          <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
        </div>
      </div>
    </>
  )
}
