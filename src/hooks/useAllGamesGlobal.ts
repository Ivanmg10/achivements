import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

export type AllGamesGlobal = {
  wantToPlay: WantToPlayGame[]
  playing: RetroAchievementsGameCompleted[]
  completed: RetroAchievementsGameCompleted[]
  loading: boolean
}

export function useAllGamesGlobal(): AllGamesGlobal {
  const { status } = useSession()
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const [playing, setPlaying] = useState<RetroAchievementsGameCompleted[]>([])
  const [completed, setCompleted] = useState<RetroAchievementsGameCompleted[]>([])
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    if (status !== 'authenticated') { setLoading(false); return }
    setLoading(true)
    Promise.all([
      fetchWithRetry('/api/getWantPlayGames'),
      fetchWithRetry('/api/getGamesCompleted'),
    ])
      .then(([wantData, completedData]) => {
        const wantResults: WantToPlayGame[] =
          (wantData as { Results?: WantToPlayGame[] })?.Results ?? []
        const allCompleted = completedData as RetroAchievementsGameCompleted[]

        const startedIds = new Set(
          allCompleted.filter((g) => g.NumAwarded > 0).map((g) => g.GameID),
        )

        setWantToPlay(
          wantResults.filter(
            (g) => !startedIds.has(g.ID ?? g.GameID!) && g.ConsoleName !== 'Events',
          ),
        )
        setPlaying(
          allCompleted.filter(
            (g) =>
              g.ConsoleName !== 'Events' &&
              Number(g.HardcoreMode) === 0 &&
              parseFloat(g.PctWon) > 0 &&
              parseFloat(g.PctWon) < 1,
          ),
        )
        const compAll = allCompleted.filter(
          (g) => g.ConsoleName !== 'Events' && parseFloat(g.PctWon) >= 1,
        )
        const best = new Map<number, RetroAchievementsGameCompleted>()
        for (const g of compAll) {
          const prev = best.get(g.GameID)
          if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
        }
        setCompleted(Array.from(best.values()))
        setLoading(false)
        attemptRef.current = 0
      })
      .catch(() => {
        const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
        attemptRef.current++
        retryTimer.current = setTimeout(doFetch, delay)
      })
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setLoading(false); return }
    if (fetched.current) return
    fetched.current = true
    doFetch()
  }, [status, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  return { wantToPlay, playing, completed, loading }
}
