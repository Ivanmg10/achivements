import { useGamesData } from '@/contexts/GamesDataContext'

export function useGamesInProgressPreview() {
  const { inProgress: listGames, isLoading, error, refetch } = useGamesData()
  return { listGames, isLoading, error, refetch }
}
