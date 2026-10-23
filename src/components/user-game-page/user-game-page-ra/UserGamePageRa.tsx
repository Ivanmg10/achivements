'use client'

import { useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { useGameProgression } from '@/hooks/useGameProgression'
import { fadeUp } from '@/lib/animations'
import { raCompareList, type CompareAchievement } from '@/utils/gameCompare'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoHeroBackground from '@/components/game-info-hero-background/GameInfoHeroBackground'
import GameInfoHeader from '@/components/game-info-header/GameInfoHeader'
import GameCompareTable from '@/components/game-compare-table/GameCompareTable'

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
        <section className="bg-bg-card p-5 rounded-xl w-[95%] mt-5 flex flex-col items-center gap-2 text-center">
          <p role="alert" className="text-danger">{T.userGame.loadError.replace('{u}', username)}</p>
          <button onClick={refetch} className="text-sm bg-bg-main px-4 py-1.5 rounded-full hover:bg-ink/10 transition-colors">
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
      <motion.div className="relative w-full flex flex-col items-center" variants={fadeUp} initial="hidden" animate="visible">
        <GameInfoHeader gameData={current} />
        <div className="w-[95%] mt-5 mb-5">
          <GameCompareTable theirs={theirs} mine={mine} username={username} comparing={comparing} mineLoading={mineLoading} notice={notice} />
        </div>
      </motion.div>
    </>
  )
}
