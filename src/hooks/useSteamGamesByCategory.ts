import { useMemo } from 'react'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { byCompletedDesc } from '@/utils/completionDates'
import { classifySteamGame, hasUnloadedProgress } from '@/utils/steamFeed'
import { inCategory } from '@/utils/libraryCategory'
import type { SteamGameProgress } from '@/types/steam'

function byLastPlayedDesc(a: SteamGameProgress, b: SteamGameProgress) {
  return (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')
}

/** Steam games for one category page ("all" for every status), derived from the shared library. */
export function useSteamGamesByCategory(category: string) {
  const { isLinked, library, libraryLoading, libraryError, refetch } = useSteamGamesData()
  const { isHidden } = useHiddenGames()

  const games = useMemo(() => {
    // Games the user hid from their lists stay out.
    const listed = library.filter((g) => inCategory(classifySteamGame(g), category) && !isHidden(g.id, 'steam'))
    // The backlog has no play dates to sort by; alphabetical is the useful order.
    return category === 'wantToPlay'
      ? listed.sort((a, b) => a.title.localeCompare(b.title))
      : listed.sort(category === 'completed' ? byCompletedDesc((g) => g.lastUnlock) : byLastPlayedDesc)
  }, [category, library, isHidden])

  /**
   * True when some played games with achievements have no counts because the
   * server's per-request budget ran out. Those games cannot be placed in
   * playing/completed, so those lists may be incomplete and should say so.
   */
  const progressTruncated = useMemo(() => hasUnloadedProgress(library), [library])

  return { games, isLinked, loading: libraryLoading, error: libraryError, progressTruncated, refetch }
}
