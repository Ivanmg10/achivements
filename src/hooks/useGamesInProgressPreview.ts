import { useGamesData } from '@/contexts/GamesDataContext'

export function useGamesInProgressPreview() {
  const { inProgress: listGames, isLoading, refetch } = useGamesData()
  return { listGames, isLoading, refetch }
}
