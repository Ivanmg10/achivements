import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

type ValidCategory = 'wantToPlay' | 'playing' | 'completed'

function isValidCategory(cat: string): cat is ValidCategory {
  return cat === 'wantToPlay' || cat === 'playing' || cat === 'completed'
}

export type CategoryGame = WantToPlayGame | RetroAchievementsGameCompleted

export function useGamesByCategory(category: string, consoleId: string) {
  const { status } = useSession()
  const [games, setGames] = useState<CategoryGame[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const fetchedForRef = useRef('')

  useEffect(() => {
    const key = `${category}-${consoleId}`
    if (status !== 'authenticated' || fetchedForRef.current === key || !isValidCategory(category)) return

    fetchedForRef.current = key
    setGames([])
    setLoading(true)
    setError(undefined)

    const id = Number(consoleId)

    if (category === 'wantToPlay') {
      fetchWithRetry('/api/getWantPlayGames')
        .then((data) => {
          const results: WantToPlayGame[] = (data as { Results?: WantToPlayGame[] })?.Results ?? []
          setGames(results.filter((g) => g.ConsoleID === id))
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
        .finally(() => setLoading(false))
    } else {
      fetchWithRetry('/api/getGamesCompleted')
        .then((data) => {
          const list = data as RetroAchievementsGameCompleted[]
          const byConsole = list.filter((g) => g.ConsoleID === id)
          if (category === 'playing') {
            setGames(
              byConsole.filter(
                (g) => Number(g.HardcoreMode) === 0 && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1,
              ),
            )
          } else {
            setGames(byConsole.filter((g) => Number(g.HardcoreMode) === 1 && parseFloat(g.PctWon) >= 1))
          }
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
        .finally(() => setLoading(false))
    }
  }, [status, category, consoleId])

  return { games, loading, error }
}
