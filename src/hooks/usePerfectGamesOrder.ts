import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

export function usePerfectGamesOrder() {
  const { status } = useSession()
  const [order, setOrder] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetched = useRef(false)

  const fetchOrder = useCallback(async () => {
    if (status !== 'authenticated') { setIsLoading(false); return }
    try {
      const res = await fetch('/api/perfectGamesOrder')
      if (!res.ok) throw new Error('fetch failed')
      const data: { game_id: number; position: number }[] = await res.json()
      setOrder(data.map((d) => d.game_id))
    } catch {
      setOrder([])
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setIsLoading(false); return }
    if (fetched.current) return
    fetched.current = true
    fetchOrder()
  }, [status, fetchOrder])

  const saveOrder = useCallback(async (newOrder: number[]) => {
    setOrder(newOrder)
    const res = await fetch('/api/perfectGamesOrder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    })
    if (!res.ok) throw new Error('Error saving order')
  }, [])

  return { order, isLoading, saveOrder }
}
