'use client'

import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { mergeRecentFeeds } from '@/utils/steamFeed'

/**
 * The recently played feed across platforms, newest first: RA's recent games
 * with Steam's, PSN's and Xbox's. `loading` until every linked platform has
 * answered, so games never pop in (and reorder) a moment later.
 */
export function useRecentFeed(max: number) {
  const { games, isLoading, error, refetch } = useRecentlyPlayedGames()
  const { recent: steamRecent, recentLoading: steamLoading } = useSteamGamesData()
  const { library: psnLibrary, libraryLoading: psnLoading } = usePsnGamesData()
  const { library: xboxLibrary, libraryLoading: xboxLoading } = useXboxGamesData()
  return {
    feed: mergeRecentFeeds(games, steamRecent, max, psnLibrary, xboxLibrary),
    loading: isLoading || steamLoading || psnLoading || xboxLoading,
    error,
    refetch,
  }
}
