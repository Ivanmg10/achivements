import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGamesData } from '@/context/GamesDataContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { buildPsnCandidates, buildRaCandidates, buildSteamCandidates, buildXboxCandidates, GameCandidate } from '@/utils/gameCandidates'
import { xboxHasAchievements } from '@/utils/xboxTitles'
import type { WantToPlayGame } from '@/types/types'
import { useHiddenGames } from '@/context/HiddenGamesContext'

/**
 * Every game the user can pick from, RA, Steam, PSN and Xbox, for the pin,
 * add-to-group and search pickers. RA comes from the shared completion and
 * recent lists plus the want-to-play list; Steam, PSN and Xbox from their libraries.
 *
 * The want-to-play list is the only thing fetched here, and only once a
 * picker is first opened (`enabled`) — as the pickers did before.
 */
export function useGameCandidates(enabled: boolean): GameCandidate[] {
  // Want-to-play is RA-only: a viewer without that account has none to fetch.
  const rausername = useSession().data?.user?.rausername
  const { isHidden } = useHiddenGames()
  const { all } = useGamesData()
  const { games: recent } = useRecentlyPlayedGames()
  const { library } = useSteamGamesData()
  const { library: psnLibrary } = usePsnGamesData()
  const { library: xboxLibrary } = useXboxGamesData()
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const wantFetched = useRef(false)

  useEffect(() => {
    if (!enabled || !rausername || wantFetched.current) return
    wantFetched.current = true
    fetchWithRetry('/api/getWantPlayGames')
      .then((data) => setWantToPlay((data as { Results?: WantToPlayGame[] })?.Results ?? []))
      .catch((err) => {
        // The picker still works from the other lists; say why a game is missing in the log.
        console.error('[useGameCandidates] want to play', err)
      })
  }, [enabled, rausername])

  return useMemo(
    () => [
      ...buildRaCandidates(all ?? [], recent ?? [], wantToPlay.filter((game) => !isHidden(game.ID ?? game.GameID!, 'ra'))),
      ...buildSteamCandidates(library ?? []),
      ...buildPsnCandidates(psnLibrary ?? []),
      ...buildXboxCandidates((xboxLibrary ?? []).filter(xboxHasAchievements)),
    ],
    [all, recent, wantToPlay, library, psnLibrary, xboxLibrary, isHidden],
  )
}
