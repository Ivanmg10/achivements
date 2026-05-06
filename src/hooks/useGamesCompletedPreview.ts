import { useMemo } from 'react'
import { useGamesData } from '@/contexts/GamesDataContext'

export function useGamesCompletedPreview() {
  const { softcore, hardcore, isLoading } = useGamesData()

  const games = useMemo(() => {
    const completedHardcore = hardcore
      .filter((g) => parseFloat(g.PctWon) >= 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const hardcoreIds = new Set(completedHardcore.map((g) => g.GameID))
    const completedSoftcore = softcore
      .filter((g) => parseFloat(g.PctWon) >= 1 && !hardcoreIds.has(g.GameID))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    return { listGames: completedSoftcore, listGamesHardcore: completedHardcore }
  }, [softcore, hardcore])

  return { ...games, isLoading }
}
