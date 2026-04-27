import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

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
      fetch('/api/getWantPlayGames')
        .then((res) => res.json())
        .then((data) => {
          const results: WantToPlayGame[] = data?.Results ?? []
          setGames(results.filter((g) => g.ConsoleID === id))
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
        .finally(() => setLoading(false))
    } else {
      fetch('/api/getGamesCompleted')
        .then((res) => res.json())
        .then((data: RetroAchievementsGameCompleted[]) => {
          const byConsole = data.filter((g) => g.ConsoleID === id)
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
