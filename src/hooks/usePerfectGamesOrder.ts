import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { gameKey } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'

/**
 * The user's own order for the "Mastered & Completed" card, as game keys
 * ("ra:123", "steam:620") — both platforms share the one list.
 */
export function usePerfectGamesOrder() {
  const { status, data: session } = useAuthSession()
  const subject = useSubject()
  const user = session?.user?.id
  const url = withSubject('/api/perfectGamesOrder', subject)
  // Coming back to a page: the order as it showed, at once, while it is read again (lastAnswers).
  const [order, setOrder] = useState<string[]>(() => lastAnswer<string[]>(user, url) ?? [])
  const [isLoading, setIsLoading] = useState(() => lastAnswer(user, url) === undefined)
  const fetched = useRef(false)

  const fetchOrder = useCallback(async () => {
    if (status !== 'authenticated') return
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      // Rows saved before Steam joined the card carry no source: they are RA's.
      const data: { game_id: number; source?: GameSource; position: number }[] = await res.json()
      setOrder(data.map((d) => gameKey(d.source ?? 'ra', d.game_id)))
    } catch {
      setOrder([])
    } finally {
      setIsLoading(false)
    }
  }, [status, url])

  // What is shown is what the next visit starts from, a saved order included.
  useEffect(() => {
    if (!isLoading) keepAnswer(user, url, order)
  }, [order, isLoading, user, url])

  useEffect(() => {
    if (status !== 'authenticated' || fetched.current) return
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
  // Signed out there is nothing to wait for.
  return { order, isLoading: isLoading && status !== 'unauthenticated', saveOrder: subject ? undefined : saveOrder }
}
