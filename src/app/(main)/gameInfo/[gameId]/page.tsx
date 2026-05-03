'use client'

import GameInfoHeader from '@/components/game-info-header/GameInfoHeader'
import GameInfoTable from '@/components/game-info-table/GameInfoTable'
import Spinner from '@/components/main-spinner/Spinner'
// import NoMainHeader from '@/components/no-main-header/NoMainHeader'
import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function GameInfo() {
  const { data: session } = useSession()
  const [gameData, setGameData] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { gameId } = useParams()
  const { T } = useLanguage()

  useEffect(() => {
    if (!session || !gameId) return
    setError(null)
    fetch(`/api/getGameProgression?gameId=${gameId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then(setGameData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error loading game'))
  }, [gameId, session?.user?.rausername])

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
    return (
      <main className="flex-1 flex flex-col items-center text-text-main">
        {/* <NoMainHeader /> */}
        <GameInfoHeader gameData={gameData} />
        <GameInfoTable gameData={gameData} />
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col justify-center items-center text-text-main">
      <Spinner size={45} />
    </main>
  )
}
