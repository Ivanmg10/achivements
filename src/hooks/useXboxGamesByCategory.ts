import { useMemo } from 'react'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { classifyXboxGame, xboxHasAchievements } from '@/utils/xboxTitles'

/**
 * Xbox games for one category page, derived from the shared list — like
 * usePsnGamesByCategory. Games the user hid stay out, and so do games with no
 * achievements at all (they are just owned); most recently played first.
 */
export function useXboxGamesByCategory(category: string) {
  const { isLinked, library, libraryLoading, libraryError, refetch } = useXboxGamesData()
  const { isHidden } = useHiddenGames()

  const games = useMemo(
    () => library.filter((g) => xboxHasAchievements(g) && classifyXboxGame(g) === category && !isHidden(g.id, 'xbox')),
    [category, library, isHidden],
  )

  return { games, isLinked, loading: libraryLoading, error: libraryError, refetch }
}
