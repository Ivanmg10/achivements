import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { useCallback, useMemo } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { useGamesData } from '@/context/GamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'

export type AllGamesGlobal = {
  wantToPlay: WantToPlayGame[]
  playing: RetroAchievementsGameCompleted[]
  completed: RetroAchievementsGameCompleted[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const WANT_URL = '/api/getWantPlayGames'
const NONE: WantToPlayGame[] = []
const wantResults = (data: unknown) => (data as { Results?: WantToPlayGame[] } | null)?.Results ?? NONE

export function useAllGamesGlobal(): AllGamesGlobal {
  const { data: session, status } = useAuthSession()
  const rausername = session?.user?.rausername
  const { isHidden } = useHiddenGames()
  // Completed/in-progress games are fetched once and shared app-wide via
  // GamesDataContext — don't re-fetch /api/getGamesCompleted here too.
  const { all: allCompleted, isLoading: completedLoading, error: completedError, refetch: refetchCompleted } = useGamesData()
  // Keyed by the RA account too: another one linked never paints the last one's answers.
  const user = session?.user?.id ? `${session.user.id}:${session.user.rausername ?? ''}` : undefined
  const want = useRetryingRead(status === 'authenticated' && rausername ? WANT_URL : null, { parse: wantResults, keepFor: user })
  const wantToPlay = want.data ?? NONE
  const refetchWant = want.refetch

  const refetch = useCallback(() => {
    refetchWant()
    if (completedError) refetchCompleted()
  }, [refetchWant, completedError, refetchCompleted])

  const startedIds = useMemo(
    () => new Set(allCompleted.filter((g) => g.NumAwarded > 0).map((g) => g.GameID)),
    [allCompleted],
  )

  const filteredWantToPlay = useMemo(
    () => wantToPlay.filter((g) => !startedIds.has(g.ID ?? g.GameID!) && g.ConsoleName !== 'Events' && !isHidden(g.ID ?? g.GameID!, 'ra')),
    [wantToPlay, startedIds, isHidden],
  )

  const playing = useMemo(() => {
    const inProgress = allCompleted.filter(
      (g) => g.ConsoleName !== 'Events' && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1,
    )
    const best = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of inProgress) {
      const prev = best.get(g.GameID)
      if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
    }
    return Array.from(best.values())
  }, [allCompleted])

  const completed = useMemo(() => {
    const compAll = allCompleted.filter((g) => g.ConsoleName !== 'Events' && parseFloat(g.PctWon) >= 1)
    const best = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of compAll) {
      const prev = best.get(g.GameID)
      if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
    }
    return Array.from(best.values())
  }, [allCompleted])

  // Signed out, or with no RA account, there is no want-to-play list to wait for.
  const wantLoading = status === 'loading' || want.isLoading
  return { wantToPlay: filteredWantToPlay, playing, completed, loading: wantLoading || completedLoading, error: want.error || completedError, refetch }
}
