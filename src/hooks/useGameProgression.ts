import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { getGamesInfo } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useGameProgression(gameId: string | null) {
  const { status, data: session } = useSession()
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!gameId || status !== 'authenticated' || hasFetched.current) return
    hasFetched.current = true
    getGamesInfo(gameId, session, setGame)
  }, [gameId, status])

  return game
}
