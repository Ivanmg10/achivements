import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGamesData } from '@/context/GamesDataContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { buildPsnCandidates, buildRaCandidates, buildSteamCandidates, GameCandidate } from '@/utils/gameCandidates'
import type { WantToPlayGame } from '@/types/types'

/**
 * Every game the user can pick from, RA, Steam and PSN, for the pin,
 * add-to-group and search pickers. RA comes from the shared completion and
 * recent lists plus the want-to-play list; Steam and PSN from their libraries.
 *
 * The want-to-play list is the only thing fetched here, and only once a
 * picker is first opened (`enabled`) — as the pickers did before.
 */
export function useGameCandidates(enabled: boolean): GameCandidate[] {
  // Want-to-play is RA-only: a viewer without that account has none to fetch.
  const rausername = useSession().data?.user?.rausername
  const { all } = useGamesData()
  const { games: recent } = useRecentlyPlayedGames()
  const { library } = useSteamGamesData()
  const { library: psnLibrary } = usePsnGamesData()
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
      ...buildRaCandidates(all ?? [], recent ?? [], wantToPlay),
      ...buildSteamCandidates(library ?? []),
      ...buildPsnCandidates(psnLibrary ?? []),
    ],
    [all, recent, wantToPlay, library, psnLibrary],
  )
}
