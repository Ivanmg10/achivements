'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { gameKey, isGameSource, GameRef } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

type CtxType = {
  /** Pinned games in display order, RA and Steam mixed. */
  pins: GameRef[]
  isLoading: boolean
  isPinned: (gameId: number, source?: GameSource) => boolean
  pinGame: (gameId: number, source?: GameSource) => Promise<void>
  unpinGame: (gameId: number, source?: GameSource) => Promise<void>
  reorder: (order: GameRef[]) => Promise<void>
}

const Ctx = createContext<CtxType>({
  pins: [],
  isLoading: true,
  isPinned: () => false,
  pinGame: async () => {},
  unpinGame: async () => {},
  reorder: async () => {},
})

const same = (a: GameRef, b: GameRef) => a.source === b.source && a.id === b.id

/**
 * The user's pinned games. A pin is a platform + id: RA game ids and Steam
 * appids overlap, so RA game 730 and Steam app 730 are separate pins. The
 * source argument defaults to RA, so RA-only callers read as before.
 */
export function PinnedGamesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [pins, setPins] = useState<GameRef[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetched = useRef(false)

  const fetchPinned = useCallback(async () => {
    if (status !== 'authenticated') {
      setIsLoading(false)
      return
    }
    try {
      const res = await fetch('/api/pinnedGames')
      if (!res.ok) throw new Error('fetch failed')
      const data: { source?: string; game_id: number; position: number }[] = await res.json()
      setPins(data.map((d) => ({ source: isGameSource(d.source) ? d.source : 'ra', id: d.game_id })))
    } catch {
      setPins([])
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      fetched.current = false
      setPins([])
      setIsLoading(false)
      return
    }
    if (fetched.current) return
    fetched.current = true
    fetchPinned()
  }, [status, fetchPinned])

  const pinnedKeys = useMemo(() => new Set(pins.map((p) => gameKey(p.source, p.id))), [pins])

  const isPinned = useCallback(
    (gameId: number, source: GameSource = 'ra') => pinnedKeys.has(gameKey(source, gameId)),
    [pinnedKeys],
  )

  const pinGame = useCallback(async (gameId: number, source: GameSource = 'ra') => {
    const ref = { source, id: gameId }
    setPins((prev) => (prev.some((p) => same(p, ref)) ? prev : [...prev, ref]))
    try {
      const res = await fetch('/api/pinnedGames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, source }),
      })
      if (!res.ok) throw new Error('Error pinning game')
    } catch (err) {
      setPins((prev) => prev.filter((p) => !same(p, ref)))
      throw err
    }
  }, [])

  const unpinGame = useCallback(async (gameId: number, source: GameSource = 'ra') => {
    const ref = { source, id: gameId }
    setPins((prev) => prev.filter((p) => !same(p, ref)))
    try {
      const res = await fetch(`/api/pinnedGames?gameId=${gameId}&source=${source}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error unpinning game')
    } catch (err) {
      setPins((prev) => (prev.some((p) => same(p, ref)) ? prev : [...prev, ref]))
      throw err
    }
  }, [])

  const reorder = useCallback(async (order: GameRef[]) => {
    setPins(order)
    const res = await fetch('/api/pinnedGames', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: order.map((p) => ({ source: p.source, gameId: p.id })) }),
    })
    if (!res.ok) throw new Error('Error saving order')
  }, [])

  return (
    <Ctx.Provider value={{ pins, isLoading, isPinned, pinGame, unpinGame, reorder }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePinnedGames = () => useContext(Ctx)
