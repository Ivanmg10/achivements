'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useLanguage } from '@/context/LanguageContext'
import { gameKey, isGameSource, parseGameKey } from '@/utils/gameRef'
import { notify } from '@/lib/notify'
import { bootstrapPart } from '@/lib/bootstrapParts'
import type { HiddenGameRow } from '@/lib/meBootstrap'
import type { GameSource } from '@/types/game'

export type HiddenGame = { source: GameSource; id: number; title: string; image: string | null }

/** The stored list: from the start-up bootstrap when it has it, else its own route. */
async function hiddenRows(userId: string | undefined): Promise<HiddenGameRow[]> {
  const fromBootstrap = userId ? await bootstrapPart(userId, 'hiddenGames') : null
  if (fromBootstrap) return fromBootstrap
  const res = await fetch('/api/hiddenGames')
  if (!res.ok) throw new Error(`hiddenGames ${res.status}`)
  return res.json()
}

type CtxType = {
  hidden: HiddenGame[]
  /** Goes up each time a hide or show is saved: what is counted on the server (the streak) reads again. */
  revision: number
  isLoading: boolean
  isHidden: (id: number, source: GameSource) => boolean
  hideGame: (game: HiddenGame) => Promise<void>
  /** Hides several games with one toast; resolves with the ones the server refused (already rolled back). */
  hideGames: (games: HiddenGame[]) => Promise<HiddenGame[]>
  showGame: (id: number, source: GameSource) => Promise<void>
}

const Ctx = createContext<CtxType>({
  hidden: [],
  revision: 0,
  isLoading: false,
  isHidden: () => false,
  hideGame: async () => {},
  hideGames: async () => [],
  showGame: async () => {},
})

const sameGame = (a: HiddenGame, b: HiddenGame) => a.source === b.source && a.id === b.id

/** One POST per game: the route takes one. True when the server kept it. */
async function postHidden(game: HiddenGame): Promise<boolean> {
  try {
    const res = await fetch('/api/hiddenGames', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: game.source, gameId: game.id, title: game.title, image: game.image }),
    })
    if (!res.ok) throw new Error(`hide ${res.status}`)
    return true
  } catch (err) {
    console.error('[HiddenGames] hide', err)
    return false
  }
}

/**
 * Games the user has hidden from their status lists. Hiding and showing
 * update the list at once and roll back, saying so, if the server refuses;
 * the outcome is always told with a toast (these happen outside a form).
 */
export function HiddenGamesProvider({ children, initialKeys }: { children: React.ReactNode; initialKeys?: string[] }) {
  const { status, data: session } = useAuthSession()
  const userId = session?.user?.id
  const { T } = useLanguage()
  const [hidden, setHidden] = useState<HiddenGame[]>(() => (initialKeys ?? []).flatMap((key) => {
    const ref = parseGameKey(key)
    return ref ? [{ ...ref, title: '', image: null }] : []
  }))
  const [loaded, setLoaded] = useState(initialKeys !== undefined)
  const [revision, setRevision] = useState(0)
  const fetched = useRef(initialKeys !== undefined)
  // Loading only while a signed-in user's list is still on its way.
  const isLoading = status === 'loading' || (status === 'authenticated' && !loaded)

  useEffect(() => {
    if (status !== 'authenticated' || fetched.current) return
    fetched.current = true
    hiddenRows(userId)
      .then((rows) =>
        setHidden(rows.filter((r) => isGameSource(r.source)).map((r) => ({ source: r.source as GameSource, id: r.game_id, title: r.title, image: r.image }))),
      )
      .catch((err) => {
        // Nothing to hide is the safe fallback: every game stays visible.
        console.error('[HiddenGames]', err)
        fetched.current = false
      })
      .finally(() => setLoaded(true))
  }, [status, userId])

  const keys = useMemo(() => new Set(hidden.map((g) => gameKey(g.source, g.id))), [hidden])
  const isHidden = useCallback((id: number, source: GameSource) => keys.has(gameKey(source, id)), [keys])

  const hideGame = useCallback(
    async (game: HiddenGame) => {
      setHidden((list) => [game, ...list.filter((g) => !sameGame(g, game))])
      if (await postHidden(game)) {
        setRevision((n) => n + 1)
        notify.success(T.toast.gameHidden)
      } else {
        setHidden((list) => list.filter((g) => !sameGame(g, game)))
        notify.error(T.toast.gameHideFailed)
      }
    },
    [T],
  )

  const hideGames = useCallback(
    async (games: HiddenGame[]) => {
      setHidden((list) => [...games, ...list.filter((g) => !games.some((n) => sameGame(n, g)))])
      // One after another: each save rebuilds the user's rankings on the server.
      const failed: HiddenGame[] = []
      for (const game of games) if (!(await postHidden(game))) failed.push(game)
      if (failed.length < games.length) setRevision((n) => n + 1)
      if (failed.length) {
        setHidden((list) => list.filter((g) => !failed.some((f) => sameGame(f, g))))
        notify.error(T.toast.gamesHideFailed)
      } else notify.success(T.toast.gamesHidden)
      return failed
    },
    [T],
  )

  const showGame = useCallback(
    async (id: number, source: GameSource) => {
      const previous = hidden
      setHidden((list) => list.filter((g) => !(g.source === source && g.id === id)))
      try {
        const res = await fetch(`/api/hiddenGames?source=${source}&gameId=${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`show ${res.status}`)
        setRevision((n) => n + 1)
        notify.success(T.toast.gameShown)
      } catch (err) {
        console.error('[HiddenGames] show', err)
        setHidden(previous)
        notify.error(T.toast.gameShowFailed)
      }
    },
    [hidden, T],
  )

  // One object per change of what it holds, so a re-render of the provider (the session updating)
  // does not re-render everything that reads it.
  const value = useMemo(() => ({ hidden, revision, isLoading, isHidden, hideGame, hideGames, showGame }), [hidden, revision, isLoading, isHidden, hideGame, hideGames, showGame])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useHiddenGames = () => useContext(Ctx)
