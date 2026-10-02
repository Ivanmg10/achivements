'use client'

import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import LoadingPage from '@/components/loading-page/LoadingPage'
import GameInfoHeroBackground from '@/components/game-info-hero-background/GameInfoHeroBackground'
import GameInfoHeader from '@/components/game-info-header/GameInfoHeader'
import GameInfoTable from '@/components/game-info-table/GameInfoTable'
import GameInfoSubsetSelector from '@/components/game-info-subset-selector/GameInfoSubsetSelector'
import GameInfoComments from '@/components/game-info-comments/GameInfoComments'
import { RetroAchievementsGameWithAchievements, SubsetGame } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function GameInfo() {
  const { status } = useSession()
  const [gameData, setGameData] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [subsets, setSubsets] = useState<SubsetGame[]>([])
  const [parentId, setParentId] = useState<number | null>(null)
  const [parentIcon, setParentIcon] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { gameId } = useParams()
  const { T } = useLanguage()

  useEffect(() => {
    if (status !== 'authenticated' || !gameId) return
    setError(null)
    setGameData(null)
    setSubsets([])
    setParentId(null)
    setParentIcon('')

    fetch(`/api/getGameProgression?gameId=${gameId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then(async (data: RetroAchievementsGameWithAchievements) => {
        setGameData(data)

        if (data.ParentGameID) {
          setParentId(data.ParentGameID)
          const [parentRes, subsetsRes] = await Promise.all([
            fetch(`/api/getGameProgression?gameId=${data.ParentGameID}`),
            fetch(`/api/getGameSubsets?gameId=${data.ParentGameID}&consoleId=${data.ConsoleID}&baseTitle=${encodeURIComponent((data.Title ?? '').split(' [Subset')[0].split(' |')[0].trim())}`),
          ])
          if (parentRes.ok) {
            const parentData: RetroAchievementsGameWithAchievements = await parentRes.json()
            setParentIcon(parentData.ImageIcon ?? '')
          }
          if (subsetsRes.ok) setSubsets(await subsetsRes.json())
        } else {
          setParentId(data.ID)
          setParentIcon(data.ImageIcon ?? '')
          const subsetsRes = await fetch(
            `/api/getGameSubsets?gameId=${data.ID}&consoleId=${data.ConsoleID}&baseTitle=${encodeURIComponent(data.Title ?? '')}`
          )
          if (subsetsRes.ok) setSubsets(await subsetsRes.json())
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error loading game'))
  }, [gameId, status])

  if (error) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center text-text-main gap-3">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={() => { setError(null); setGameData(null) }}
          className="text-sm text-text-secondary underline"
        >
          {T.gameInfoPage.retry}
        </button>
      </main>
    )
  }

  if (gameData !== null) {
    const showSelector = subsets.length > 0 || parentId !== null
    const heroImage = gameData.ImageTitle ?? gameData.ImageIngame ?? null

    return (
      <main className="flex-1 flex flex-col items-center text-text-main relative">
        <GameInfoHeroBackground imagePath={heroImage} />
        <motion.div
          className="relative w-full flex flex-col items-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <GameInfoHeader gameData={gameData}>
            {showSelector && (
              <GameInfoSubsetSelector
                currentId={gameData.ID!}
                parentId={parentId !== gameData.ID ? parentId : null}
                parentIcon={parentIcon}
                subsets={subsets}
              />
            )}
          </GameInfoHeader>
          <GameInfoTable gameData={gameData} />
          {gameData.ID && <GameInfoComments gameId={gameData.ID} />}
        </motion.div>
      </main>
    )
  }

  return <LoadingPage subtitle={T.loadingPage.game} />
}
