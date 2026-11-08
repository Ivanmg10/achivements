'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { gameKey, isGameSource, GameRef } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useHiddenGames } from '@/context/HiddenGamesContext'

type CtxType = {
  /** Pinned games in display order, RA and Steam mixed. */
  pins: GameRef[]
  isLoading: boolean
  /** The list could not be read: not the same as having no pins. */
  error: boolean
  /** Reads the list again after a failure. */
  retry: () => void
  isPinned: (gameId: number, source?: GameSource) => boolean
  pinGame: (gameId: number, source?: GameSource) => Promise<void>
  unpinGame: (gameId: number, source?: GameSource) => Promise<void>
  reorder: (order: GameRef[]) => Promise<void>
}

const Ctx = createContext<CtxType & { request: () => void }>({
  pins: [],
  isLoading: true,
  error: false,
  retry: () => {},
  isPinned: () => false,
  pinGame: async () => {},
  unpinGame: async () => {},
  reorder: async () => {},
  request: () => {},
})

const same = (a: GameRef, b: GameRef) => a.source === b.source && a.id === b.id

/**
 * The user's pinned games. A pin is a platform + id: RA game ids and Steam
 * appids overlap, so RA game 730 and Steam app 730 are separate pins. The
 * source argument defaults to RA, so RA-only callers read as before.
 */
export function PinnedGamesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuthSession()
  const { isHidden, isLoading: hiddenLoading } = useHiddenGames()
  const [pins, setPins] = useState<GameRef[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [wanted, setWanted] = useState(false)
  const request = useCallback(() => setWanted(true), [])
  const fetched = useRef(false)

  const fetchPinned = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      const res = await fetch('/api/pinnedGames')
      if (!res.ok) throw new Error('fetch failed')
      const data: { source?: string; game_id: number; position: number }[] = await res.json()
      setPins(data.map((d) => ({ source: isGameSource(d.source) ? d.source : 'ra', id: d.game_id })))
      setError(false)
    } catch (err) {
      // A failed read is not an empty list: the pins stay as they were and the readers can offer to try again.
      console.error('[PinnedGamesContext] read', err)
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [status])

  const signedOut = status === 'unauthenticated'

  // Starting over is state, so it happens while rendering; the ref and the fetch stay in the effect.
  useWhenChanged([signedOut], () => {
    if (signedOut) {
      setPins([])
      setIsLoading(false)
    }
  })

  useEffect(() => {
    if (status === 'loading') return
    if (signedOut) {
      fetched.current = false
      return
    }
    if (!wanted || fetched.current) return
    fetched.current = true
    fetchPinned()
  }, [status, signedOut, fetchPinned, wanted])

  const retry = useCallback(() => {
    setError(false)
    setIsLoading(true)
    fetchPinned()
  }, [fetchPinned])

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

  // Optimistic: the new order at once, the old one back if it could not be saved (the caller says so).
  const reorder = useCallback(async (order: GameRef[]) => {
    const before = pins
    setPins(order)
    try {
      const res = await fetch('/api/pinnedGames', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: order.map((p) => ({ source: p.source, gameId: p.id })) }),
      })
      if (!res.ok) throw new Error('Error saving order')
    } catch (err) {
      setPins(before)
      throw err
    }
  }, [pins])

  // One object per change of what it holds, so a re-render of the provider (the session updating)
  // does not re-render everything that reads it.
  const visiblePins = useMemo(() => hiddenLoading ? [] : pins.filter((pin) => !isHidden(pin.id, pin.source)), [pins, isHidden, hiddenLoading])
  const value = useMemo(() => ({ pins: visiblePins, isLoading: Boolean(isLoading || hiddenLoading), error, retry, isPinned, pinGame, unpinGame, reorder, request }), [visiblePins, isLoading, hiddenLoading, error, retry, isPinned, pinGame, unpinGame, reorder, request])

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  )
}

/** Reading the pins is what asks for them: the first reader starts the load (#101). */
export function usePinnedGames(): CtxType {
  const { request, ...value } = useContext(Ctx)
  useEffect(request, [request])
  return value
}
