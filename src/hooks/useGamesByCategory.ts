import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useGamesData } from '@/context/GamesDataContext'

type ValidCategory = 'wantToPlay' | 'playing' | 'completed'

function isValidCategory(cat: string): cat is ValidCategory {
  return cat === 'wantToPlay' || cat === 'playing' || cat === 'completed'
}

export type CategoryGame = WantToPlayGame | RetroAchievementsGameCompleted

export function useGamesByCategory(category: string, consoleId?: string) {
  const { status } = useSession()
  // Completed/in-progress games are fetched once and shared app-wide via
  // GamesDataContext — don't re-fetch /api/getGamesCompleted here too.
  const { all: allCompleted, isLoading: completedLoading } = useGamesData()
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const [wantLoading, setWantLoading] = useState(true)
  const [error, setError] = useState<string>()
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || category !== 'wantToPlay') { setWantLoading(false); return }
    if (fetchedRef.current) return
    fetchedRef.current = true
    setWantLoading(true)
    fetchWithRetry('/api/getWantPlayGames')
      .then((data) => {
        setWantToPlay((data as { Results?: WantToPlayGame[] })?.Results ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setWantLoading(false))
  }, [status, category])

  const id = consoleId ? Number(consoleId) : null

  const games = useMemo<CategoryGame[]>(() => {
    if (!isValidCategory(category)) return []

    if (category === 'wantToPlay') {
      const startedIds = new Set(allCompleted.filter((g) => g.NumAwarded > 0).map((g) => g.GameID))
      const filtered = wantToPlay.filter((g) => !startedIds.has(g.ID ?? g.GameID!) && g.ConsoleName !== 'Events')
      return id !== null ? filtered.filter((g) => g.ConsoleID === id) : filtered
    }

    const byConsole = (id !== null ? allCompleted.filter((g) => g.ConsoleID === id) : allCompleted)
      .filter((g) => g.ConsoleName !== 'Events')

    const pool = category === 'playing'
      ? byConsole.filter((g) => parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1)
      : byConsole.filter((g) => parseFloat(g.PctWon) >= 1)

    const best = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of pool) {
      const prev = best.get(g.GameID)
      if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
    }
    return Array.from(best.values())
  }, [category, id, allCompleted, wantToPlay])

  const loading = category === 'wantToPlay' ? wantLoading || completedLoading : completedLoading

  return { games, loading, error }
}
