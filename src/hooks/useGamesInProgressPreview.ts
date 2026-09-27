import { useGamesData } from '@/context/GamesDataContext'

export function useGamesInProgressPreview() {
  const { inProgress: listGames, isLoading, error, refetch } = useGamesData()
  return { listGames, isLoading, error, refetch }
}
