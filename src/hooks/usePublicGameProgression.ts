import { useEffect, useState } from 'react'
import { RetroAchievementsGameWithAchievements } from '@/types/types'

export function usePublicGameProgression(raUsername: string, gameId: number | null) {
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!raUsername || !gameId) return
    setIsLoading(true)
    fetch(`/api/public/user/gameProgression?u=${encodeURIComponent(raUsername)}&gameId=${gameId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        setGame(data?.ID ? data : null)
        setIsLoading(false)
      })
      .catch(() => {
        setGame(null)
        setIsLoading(false)
      })
  }, [raUsername, gameId])

  return { game, isLoading }
}
