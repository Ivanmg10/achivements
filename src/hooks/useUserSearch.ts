import { useEffect, useState } from 'react'
import { useWhenChanged } from '@/hooks/useWhenChanged'

export type UserSearchResult = { username: string; avatar: string | null; ra: boolean; steam: boolean; psn: boolean }

export const USER_SEARCH_MIN = 3
const DEBOUNCE_MS = 300

/**
 * CheevoVault users whose name starts with `query`, searched once the user
 * stops typing. `error` is a failed request, which is not the same as no match.
 */
export function useUserSearch(query: string, enabled: boolean) {
  const q = query.trim()
  const active = enabled && q.length >= USER_SEARCH_MIN
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  // A new query starts over; state, so while rendering. The debounced search is the effect.
  useWhenChanged([q, active], () => {
    setResults([])
    setError(false)
    setIsLoading(active)
  })

  useEffect(() => {
    if (!active) return
    let stale = false
    const timer = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then((res) => {
          if (!res.ok) throw new Error(`search ${res.status}`)
          return res.json() as Promise<UserSearchResult[]>
        })
        .then((rows) => { if (!stale) setResults(rows) })
        .catch((err) => {
          console.error('[useUserSearch]', err)
          if (!stale) setError(true)
        })
        .finally(() => { if (!stale) setIsLoading(false) })
    }, DEBOUNCE_MS)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [q, active])

  return { results, isLoading, error, active }
}
