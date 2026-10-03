'use client'

import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useGameInfo } from '@/hooks/useGameInfo'
import { fadeUp } from '@/lib/animations'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoHeroBackground from '@/components/game-info-hero-background/GameInfoHeroBackground'
import GameInfoHeader from '@/components/game-info-header/GameInfoHeader'
import GameInfoTable from '@/components/game-info-table/GameInfoTable'
import GameInfoSubsetSelector from '@/components/game-info-subset-selector/GameInfoSubsetSelector'
import GameInfoComments from '@/components/game-info-comments/GameInfoComments'

/**
 * An RA game's page. While the game loads it shows the page's own skeleton
 * (not a full-screen loader); the subset tabs hold their place until they
 * are known, and every picture holds its shape until it has loaded.
 */
export default function GameInfo() {
  const { gameId } = useParams()
  const { T } = useLanguage()
  const { game, parentId, parentIcon, subsets, subsetsLoading, error, retry } = useGameInfo(
    typeof gameId === 'string' ? gameId : null,
  )

  if (error) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center text-text-main gap-3">
        <p role="alert" className="text-red-400 text-lg">{error}</p>
        <button onClick={retry} className="text-sm text-text-secondary underline">
          {T.gameInfoPage.retry}
        </button>
      </main>
    )
  }

  if (!game) return <GameInfoSkeleton />

  const showSelector = subsetsLoading || subsets.length > 0 || parentId !== null
  const heroImage = game.ImageTitle ?? game.ImageIngame ?? null

  return (
    <main className="flex-1 flex flex-col items-center text-text-main relative">
      <GameInfoHeroBackground imagePath={heroImage} />
      <motion.div className="relative w-full flex flex-col items-center" variants={fadeUp} initial="hidden" animate="visible">
        <GameInfoHeader gameData={game}>
          {showSelector && (
            <GameInfoSubsetSelector
              currentId={game.ID!}
              parentId={parentId !== game.ID ? parentId : null}
              parentIcon={parentIcon}
              subsets={subsets}
              isLoading={subsetsLoading}
            />
          )}
        </GameInfoHeader>
        <GameInfoTable gameData={game} />
        {game.ID && <GameInfoComments gameId={game.ID} />}
      </motion.div>
    </main>
  )
}
