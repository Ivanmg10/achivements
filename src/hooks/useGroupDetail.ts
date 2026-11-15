import { useEffect, useState } from 'react'
import type { GameGroup } from '@/types/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'

/**
 * One group with its games, for the group shown in full on the home page.
 * Keyed by id: switching groups shows the new one's loading state rather than
 * the old one's games, and an answer for a group no longer selected is dropped.
 */
export function useGroupDetail(id: number | null) {
  const user = useAuthSession().data?.user?.id
  // Coming back to the home: the group as it showed, at once, while it is read again (lastAnswers).
  const [state, setState] = useState<{ id: number; group: GameGroup | null; error: boolean } | null>(() => {
    const group = id !== null ? lastAnswer<GameGroup>(user, `/api/groups/${id}`) : undefined
    return group && id !== null ? { id, group, error: false } : null
  })

  useEffect(() => {
    if (id === null) return
    let cancelled = false
    fetch(`/api/groups/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`groups/${id} ${res.status}`)
        return res.json()
      })
      .then((group: GameGroup) => {
        keepAnswer(user, `/api/groups/${id}`, group)
        if (!cancelled) setState({ id, group, error: false })
      })
      .catch((err) => {
        console.error('[useGroupDetail]', err)
        if (!cancelled) setState({ id, group: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [id, user])

  const current = state && state.id === id ? state : null
  return {
    group: current?.group ?? null,
    isLoading: id !== null && current === null,
    error: current?.error ?? false,
  }
}
