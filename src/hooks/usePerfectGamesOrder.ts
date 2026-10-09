import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { gameKey } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

/**
 * The user's own order for the "Mastered & Completed" card, as game keys
 * ("ra:123", "steam:620") — both platforms share the one list.
 */
export function usePerfectGamesOrder() {
  const { status } = useSession()
  const subject = useSubject()
  const [order, setOrder] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetched = useRef(false)

  const fetchOrder = useCallback(async () => {
    if (status !== 'authenticated') { setIsLoading(false); return }
    try {
      const res = await fetch(withSubject('/api/perfectGamesOrder', subject))
      if (!res.ok) throw new Error('fetch failed')
      // Rows saved before Steam joined the card carry no source: they are RA's.
      const data: { game_id: number; source?: GameSource; position: number }[] = await res.json()
      setOrder(data.map((d) => gameKey(d.source ?? 'ra', d.game_id)))
    } catch {
      setOrder([])
    } finally {
      setIsLoading(false)
    }
  }, [status, subject])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setIsLoading(false); return }
    if (fetched.current) return
    fetched.current = true
    fetchOrder()
  }, [status, fetchOrder])

  const saveOrder = useCallback(async (newOrder: string[]) => {
    setOrder(newOrder)
    const res = await fetch('/api/perfectGamesOrder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    })
    if (!res.ok) throw new Error('Error saving order')
  }, [])

  // Someone else's order is theirs to change: there it can only be read.
  return { order, isLoading, saveOrder: subject ? undefined : saveOrder }
}
