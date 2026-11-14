import { useState } from 'react'
import type { RetroAchievement } from '@/types/types'

/**
 * Pins one RetroAchievements achievement (a favourite) through `/api/favorites`. `pinningId` is the one on its way
 * and `error` is set when the server refused or could not be reached; the caller shows both.
 */
export function usePinRaAchievement(game: { gameId: number; gameTitle: string; numDistinctPlayers: number }) {
  const [pinningId, setPinningId] = useState<number | null>(null)
  const [error, setError] = useState(false)

  async function pin(achievement: RetroAchievement): Promise<boolean> {
    setPinningId(achievement.ID)
    setError(false)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement, ...game }),
      })
      if (!res.ok) {
        setError(true)
        setPinningId(null)
        return false
      }
      return true
    } catch {
      setError(true)
      setPinningId(null)
      return false
    }
  }

  function reset() {
    setPinningId(null)
    setError(false)
  }

  return { pin, pinningId, error, reset }
}
