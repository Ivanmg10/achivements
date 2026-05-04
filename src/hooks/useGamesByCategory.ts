import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

type ValidCategory = 'wantToPlay' | 'playing' | 'completed'

function isValidCategory(cat: string): cat is ValidCategory {
  return cat === 'wantToPlay' || cat === 'playing' || cat === 'completed'
}

export type CategoryGame = WantToPlayGame | RetroAchievementsGameCompleted

export function useGamesByCategory(category: string, consoleId?: string) {
  const { status } = useSession()
  const [games, setGames] = useState<CategoryGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const fetchedForRef = useRef('')

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setLoading(false); return }
    const key = `${category}-${consoleId ?? 'all'}`
    if (fetchedForRef.current === key || !isValidCategory(category)) { setLoading(false); return }

    fetchedForRef.current = key
    setGames([])
    setLoading(true)
    setError(undefined)

    const id = consoleId ? Number(consoleId) : null

    if (category === 'wantToPlay') {
      Promise.all([
        fetchWithRetry('/api/getWantPlayGames'),
        fetchWithRetry('/api/getGamesCompleted'),
      ])
        .then(([wantData, completedData]) => {
          const results: WantToPlayGame[] = (wantData as { Results?: WantToPlayGame[] })?.Results ?? []
          const completed = completedData as RetroAchievementsGameCompleted[]
          const startedIds = new Set(
            completed.filter((g) => g.NumAwarded > 0).map((g) => g.GameID)
          )
          const filtered = results.filter((g) => !startedIds.has(g.ID ?? g.GameID!) && g.ConsoleName !== 'Events')
          setGames(id !== null ? filtered.filter((g) => g.ConsoleID === id) : filtered)
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
        .finally(() => setLoading(false))
    } else {
      fetchWithRetry('/api/getGamesCompleted')
        .then((data) => {
          const list = data as RetroAchievementsGameCompleted[]
          const byConsole = (id !== null ? list.filter((g) => g.ConsoleID === id) : list)
            .filter((g) => g.ConsoleName !== 'Events')
          if (category === 'playing') {
            setGames(
              byConsole.filter(
                (g) => Number(g.HardcoreMode) === 0 && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1,
              ),
            )
          } else {
            const all = byConsole.filter((g) => parseFloat(g.PctWon) >= 1)
            const best = new Map<number, RetroAchievementsGameCompleted>()
            for (const g of all) {
              const prev = best.get(g.GameID)
              if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
            }
            setGames(Array.from(best.values()))
          }
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
        .finally(() => setLoading(false))
    }
  }, [status, category, consoleId])

  return { games, loading, error }
}
