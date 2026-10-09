import { useMemo } from 'react'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { classifyPsnGame } from '@/utils/psnTitles'

/**
 * PSN games for one category page, derived from the shared list — like
 * useSteamGamesByCategory. Games the user hid stay out; most recently played
 * first.
 */
export function usePsnGamesByCategory(category: string) {
  const { isLinked, library, libraryLoading, libraryError, refetch } = usePsnGamesData()
  const { isHidden } = useHiddenGames()

  const games = useMemo(
    () => library.filter((g) => classifyPsnGame(g) === category && !isHidden(g.id, 'psn')),
    [category, library, isHidden],
  )

  return { games, isLinked, loading: libraryLoading, error: libraryError, refetch }
}
