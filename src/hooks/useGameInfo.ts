import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { RetroAchievementsGameWithAchievements, SubsetGame } from '@/types/types'

type State = {
  game: RetroAchievementsGameWithAchievements | null
  /** The main game's id: the game itself, or its parent for a subset. */
  parentId: number | null
  parentIcon: string
  subsets: SubsetGame[]
  /** The game is in, its subsets are still being looked up. */
  subsetsLoading: boolean
  error: string | null
}

const EMPTY: State = { game: null, parentId: null, parentIcon: '', subsets: [], subsetsLoading: false, error: null }

/** The title a subset shares with its main game, for looking the subsets up. */
function baseTitle(title: string | null | undefined): string {
  return (title ?? '').split(' [Subset')[0].split(' |')[0].trim()
}

/**
 * An RA game's page data: the game with the user's progress first, then its
 * main game and subsets. The page can draw as soon as the game is in; the
 * subset tabs follow (`subsetsLoading` lets it hold their place). A failed
 * subset lookup only costs the tabs, never the page. `retry` asks again.
 */
export function useGameInfo(gameId: string | null) {
  const { status } = useSession()
  const [state, setState] = useState<State>(EMPTY)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (status !== 'authenticated' || !gameId) return
    let cancelled = false
    const set = (patch: Partial<State>) => {
      if (!cancelled) setState((s) => ({ ...s, ...patch }))
    }
    setState(EMPTY)

    ;(async () => {
      let game: RetroAchievementsGameWithAchievements
      try {
        const res = await fetch(`/api/getGameProgression?gameId=${gameId}`)
        if (!res.ok) throw new Error(`Error ${res.status}`)
        game = await res.json()
      } catch (err) {
        console.error('[useGameInfo]', err)
        set({ error: err instanceof Error ? err.message : 'Error loading game' })
        return
      }

      const isSubset = Boolean(game.ParentGameID)
      const parentId = isSubset ? game.ParentGameID! : game.ID!
      set({ game, parentId, parentIcon: isSubset ? '' : game.ImageIcon ?? '', subsetsLoading: true })

      try {
        const title = isSubset ? baseTitle(game.Title) : game.Title ?? ''
        const [parentRes, subsetsRes] = await Promise.all([
          isSubset ? fetch(`/api/getGameProgression?gameId=${parentId}`) : null,
          fetch(`/api/getGameSubsets?gameId=${parentId}&consoleId=${game.ConsoleID}&baseTitle=${encodeURIComponent(title)}`),
        ])
        if (parentRes) {
          if (!parentRes.ok) throw new Error(`parent ${parentRes.status}`)
          const parent: RetroAchievementsGameWithAchievements = await parentRes.json()
          set({ parentIcon: parent.ImageIcon ?? '' })
        }
        if (!subsetsRes.ok) throw new Error(`subsets ${subsetsRes.status}`)
        set({ subsets: await subsetsRes.json() })
      } catch (err) {
        console.error('[useGameInfo] subsets', err)
      } finally {
        set({ subsetsLoading: false })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [gameId, status, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { ...state, retry }
}
