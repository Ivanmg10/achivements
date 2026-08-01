'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

type CtxType = {
  pinnedIds: number[]
  isLoading: boolean
  isPinned: (gameId: number) => boolean
  pinGame: (gameId: number) => Promise<void>
  unpinGame: (gameId: number) => Promise<void>
  reorder: (order: number[]) => Promise<void>
}

const Ctx = createContext<CtxType>({
  pinnedIds: [],
  isLoading: true,
  isPinned: () => false,
  pinGame: async () => {},
  unpinGame: async () => {},
  reorder: async () => {},
})

export function PinnedGamesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [pinnedIds, setPinnedIds] = useState<number[]>([])
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
      const data: { game_id: number; position: number }[] = await res.json()
      setPinnedIds(data.map((d) => d.game_id))
    } catch {
      setPinnedIds([])
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      fetched.current = false
      setPinnedIds([])
      setIsLoading(false)
      return
    }
    if (fetched.current) return
    fetched.current = true
    fetchPinned()
  }, [status, fetchPinned])

  const isPinned = useCallback((gameId: number) => pinnedIds.includes(gameId), [pinnedIds])

  const pinGame = useCallback(async (gameId: number) => {
    setPinnedIds((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]))
    try {
      const res = await fetch('/api/pinnedGames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      })
      if (!res.ok) throw new Error('Error pinning game')
    } catch (err) {
      setPinnedIds((prev) => prev.filter((id) => id !== gameId))
      throw err
    }
  }, [])

  const unpinGame = useCallback(async (gameId: number) => {
    setPinnedIds((prev) => prev.filter((id) => id !== gameId))
    try {
      const res = await fetch(`/api/pinnedGames?gameId=${gameId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error unpinning game')
    } catch (err) {
      setPinnedIds((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]))
      throw err
    }
  }, [])

  const reorder = useCallback(async (order: number[]) => {
    setPinnedIds(order)
    const res = await fetch('/api/pinnedGames', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
    if (!res.ok) throw new Error('Error saving order')
  }, [])

  return (
    <Ctx.Provider value={{ pinnedIds, isLoading, isPinned, pinGame, unpinGame, reorder }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePinnedGames = () => useContext(Ctx)
