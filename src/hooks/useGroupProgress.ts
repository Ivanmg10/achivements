import { useCallback, useMemo } from 'react'
import { useGamesData } from '@/context/GamesDataContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import type { GameGroupItem } from '@/types/types'
import { closestItem, groupStateCounts, groupSummary, itemProgress, liveProgressMap, raProgressMaps } from '@/utils/groupItems'

/**
 * A group's games read against the freshest progress there is (RA's live
 * lists, the Steam, PSN and Xbox libraries), so the group page and the home
 * page give the same numbers: the whole group, how many are in each state,
 * the one closest to done, and each game's own progress.
 */
export function useGroupProgress(items: GameGroupItem[]) {
  const { all } = useGamesData()
  const { games: recentlyPlayed } = useRecentlyPlayedGames()
  const { library: steam } = useSteamGamesData()
  const { library: psn } = usePsnGamesData()
  const { library: xbox } = useXboxGamesData()

  const ra = useMemo(() => raProgressMaps(recentlyPlayed, all), [recentlyPlayed, all])
  const live = useMemo(() => liveProgressMap(steam, psn, xbox), [steam, psn, xbox])
  const summary = useMemo(() => groupSummary(items, ra.ach, live), [items, ra.ach, live])
  const states = useMemo(() => groupStateCounts(items, live, ra.ach), [items, live, ra.ach])
  const closest = useMemo(() => closestItem(items, live, ra.ach), [items, live, ra.ach])
  const progress = useCallback((item: GameGroupItem) => itemProgress(item, live, ra.ach), [live, ra.ach])

  return { ra, live, summary, states, closest, progress }
}
