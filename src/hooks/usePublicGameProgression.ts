import { useEffect, useState } from 'react'
import { RetroAchievementsGameWithAchievements } from '@/types/types'

export function usePublicGameProgression(raUsername: string, gameId: number | null) {
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!raUsername || !gameId) return
    setIsLoading(true)
    setError(false)
    fetch(`/api/public/user/gameProgression?u=${encodeURIComponent(raUsername)}&gameId=${gameId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`gameProgression ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setGame(data?.ID ? data : null)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('[usePublicGameProgression]', err)
        setGame(null)
        setError(true)
        setIsLoading(false)
      })
  }, [raUsername, gameId])

  return { game, isLoading, error }
}
