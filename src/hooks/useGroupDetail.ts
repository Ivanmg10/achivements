import { useEffect, useState } from 'react'
import type { GameGroup } from '@/types/types'

/**
 * One group with its games, for the group shown in full on the home page.
 * Keyed by id: switching groups shows the new one's loading state rather than
 * the old one's games, and an answer for a group no longer selected is dropped.
 */
export function useGroupDetail(id: number | null) {
  const [state, setState] = useState<{ id: number; group: GameGroup | null; error: boolean } | null>(null)

  useEffect(() => {
    if (id === null) return
    let cancelled = false
    fetch(`/api/groups/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`groups/${id} ${res.status}`)
        return res.json()
      })
      .then((group: GameGroup) => {
        if (!cancelled) setState({ id, group, error: false })
      })
      .catch((err) => {
        console.error('[useGroupDetail]', err)
        if (!cancelled) setState({ id, group: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const current = state && state.id === id ? state : null
  return {
    group: current?.group ?? null,
    isLoading: id !== null && current === null,
    error: current?.error ?? false,
  }
}
