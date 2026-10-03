import { useMemo } from 'react'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { classifySteamGame, hasUnloadedProgress, SteamCategory } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'

function isSteamCategory(cat: string): cat is SteamCategory {
  return cat === 'wantToPlay' || cat === 'playing' || cat === 'completed'
}

function byLastPlayedDesc(a: SteamGameProgress, b: SteamGameProgress) {
  return (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')
}

/** Steam games for one category page, derived from the shared library. */
export function useSteamGamesByCategory(category: string) {
  const { isLinked, library, libraryLoading, libraryError, refetch } = useSteamGamesData()
  const { isHidden } = useHiddenGames()

  const games = useMemo(() => {
    if (!isSteamCategory(category)) return []
    // Games the user hid from their lists stay out.
    const inCategory = library.filter((g) => classifySteamGame(g) === category && !isHidden(g.id, 'steam'))
    // The backlog has no play dates to sort by; alphabetical is the useful order.
    return category === 'wantToPlay'
      ? inCategory.sort((a, b) => a.title.localeCompare(b.title))
      : inCategory.sort(byLastPlayedDesc)
  }, [category, library, isHidden])

  /**
   * True when some played games with achievements have no counts because the
   * server's per-request budget ran out. Those games cannot be placed in
   * playing/completed, so those lists may be incomplete and should say so.
   */
  const progressTruncated = useMemo(() => hasUnloadedProgress(library), [library])

  return { games, isLinked, loading: libraryLoading, error: libraryError, progressTruncated, refetch }
}
