import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useGamesData } from '@/context/GamesDataContext'
import { useRaLinked } from '@/hooks/useRaLinked'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { raGameId } from '@/utils/gameRef'
import type { LibraryCategory } from '@/utils/libraryCategory'

function isValidCategory(cat: string): cat is LibraryCategory {
  return cat === 'wantToPlay' || cat === 'playing' || cat === 'completed' || cat === 'all'
}

export type CategoryGame = WantToPlayGame | RetroAchievementsGameCompleted

export function useGamesByCategory(category: string, consoleId?: string) {
  const { status } = useAuthSession()
  const raLinked = useRaLinked()
  // Completed/in-progress games are fetched once and shared app-wide via
  // GamesDataContext — don't re-fetch /api/getGamesCompleted here too.
  const { all: allCompleted, isLoading: completedLoading } = useGamesData()
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const [wantLoading, setWantLoading] = useState(true)
  const [error, setError] = useState<string>()
  const fetchedRef = useRef(false)
  // The want-to-play list is RA's own: read for its page and for "all".
  const asksWant = category === 'wantToPlay' || category === 'all'

  useEffect(() => {
    if (status === 'loading' || status === 'unauthenticated' || !raLinked || !asksWant) return
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchWithRetry('/api/getWantPlayGames')
      .then((data) => {
        setWantToPlay((data as { Results?: WantToPlayGame[] })?.Results ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setWantLoading(false))
  }, [status, raLinked, asksWant])

  const id = consoleId ? Number(consoleId) : null

  const games = useMemo<CategoryGame[]>(() => {
    if (!isValidCategory(category)) return []

    const notStarted = () => {
      const startedIds = new Set(allCompleted.filter((g) => g.NumAwarded > 0).map((g) => g.GameID))
      const filtered = wantToPlay.filter((g) => !startedIds.has(g.ID ?? g.GameID!) && g.ConsoleName !== 'Events')
      return id !== null ? filtered.filter((g) => g.ConsoleID === id) : filtered
    }
    if (category === 'wantToPlay') return notStarted()

    const byConsole = (id !== null ? allCompleted.filter((g) => g.ConsoleID === id) : allCompleted)
      .filter((g) => g.ConsoleName !== 'Events')

    const pct = (g: RetroAchievementsGameCompleted) => parseFloat(g.PctWon)
    // "all": every game started, once each (its best mode), then the want-to-play list.
    const pool = category === 'playing'
      ? byConsole.filter((g) => pct(g) > 0 && pct(g) < 1)
      : category === 'completed'
        ? byConsole.filter((g) => pct(g) >= 1)
        : byConsole.filter((g) => pct(g) > 0)

    const best = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of pool) {
      const prev = best.get(g.GameID)
      if (!prev || Number(g.HardcoreMode) > Number(prev.HardcoreMode)) best.set(g.GameID, g)
    }
    const started = Array.from(best.values())
    return category === 'all' ? [...started, ...notStarted()] : started
  }, [category, id, allCompleted, wantToPlay])

  // The list is only waited for while it is going to be asked for: not signed out, not without RA.
  const wantPending = wantLoading && (status === 'loading' || (status !== 'unauthenticated' && raLinked))
  const loading = asksWant ? wantPending || completedLoading : completedLoading

  // Games the user hid from their lists stay out of every list.
  const { isHidden } = useHiddenGames()
  const visible = useMemo(
    () => games.filter((g) => !isHidden(raGameId(g), 'ra')),
    [games, isHidden],
  )

  return { games: visible, loading, error }
}
