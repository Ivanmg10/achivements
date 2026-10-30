'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { gameKey, isGameSource, parseGameKey } from '@/utils/gameRef'
import { notify } from '@/lib/notify'
import type { GameSource } from '@/types/steam'

export type HiddenGame = { source: GameSource; id: number; title: string; image: string | null }

type CtxType = {
  hidden: HiddenGame[]
  isLoading: boolean
  isHidden: (id: number, source: GameSource) => boolean
  hideGame: (game: HiddenGame) => Promise<void>
  showGame: (id: number, source: GameSource) => Promise<void>
}

const Ctx = createContext<CtxType>({
  hidden: [],
  isLoading: false,
  isHidden: () => false,
  hideGame: async () => {},
  showGame: async () => {},
})

/**
 * Games the user has hidden from their status lists. Hiding and showing
 * update the list at once and roll back, saying so, if the server refuses;
 * the outcome is always told with a toast (these happen outside a form).
 */
export function HiddenGamesProvider({ children, initialKeys }: { children: React.ReactNode; initialKeys?: string[] }) {
  const { status } = useSession()
  const { T } = useLanguage()
  const [hidden, setHidden] = useState<HiddenGame[]>(() => (initialKeys ?? []).flatMap((key) => {
    const ref = parseGameKey(key)
    return ref ? [{ ...ref, title: '', image: null }] : []
  }))
  const [loaded, setLoaded] = useState(initialKeys !== undefined)
  const fetched = useRef(initialKeys !== undefined)
  // Loading only while a signed-in user's list is still on its way.
  const isLoading = status === 'loading' || (status === 'authenticated' && !loaded)

  useEffect(() => {
    if (status !== 'authenticated' || fetched.current) return
    fetched.current = true
    fetch('/api/hiddenGames')
      .then((res) => {
        if (!res.ok) throw new Error(`hiddenGames ${res.status}`)
        return res.json()
      })
      .then((rows: { source: string; game_id: number; title: string; image: string | null }[]) =>
        setHidden(rows.filter((r) => isGameSource(r.source)).map((r) => ({ source: r.source as GameSource, id: r.game_id, title: r.title, image: r.image }))),
      )
      .catch((err) => {
        // Nothing to hide is the safe fallback: every game stays visible.
        console.error('[HiddenGames]', err)
        fetched.current = false
      })
      .finally(() => setLoaded(true))
  }, [status])

  const keys = useMemo(() => new Set(hidden.map((g) => gameKey(g.source, g.id))), [hidden])
  const isHidden = useCallback((id: number, source: GameSource) => keys.has(gameKey(source, id)), [keys])

  const hideGame = useCallback(
    async (game: HiddenGame) => {
      setHidden((list) => [game, ...list.filter((g) => !(g.source === game.source && g.id === game.id))])
      try {
        const res = await fetch('/api/hiddenGames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: game.source, gameId: game.id, title: game.title, image: game.image }),
        })
        if (!res.ok) throw new Error(`hide ${res.status}`)
        notify.success(T.toast.gameHidden)
      } catch (err) {
        console.error('[HiddenGames] hide', err)
        setHidden((list) => list.filter((g) => !(g.source === game.source && g.id === game.id)))
        notify.error(T.toast.gameHideFailed)
      }
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
  const value = useMemo(() => ({ hidden, isLoading, isHidden, hideGame, showGame }), [hidden, isLoading, isHidden, hideGame, showGame])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useHiddenGames = () => useContext(Ctx)
