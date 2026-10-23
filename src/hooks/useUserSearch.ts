import { useEffect, useState } from 'react'
import { useWhenChanged } from '@/hooks/useWhenChanged'

export type UserSearchResult = {
  username: string
  /** Seen in the last 5 minutes; false too for who does not share it. */
  online?: boolean
  /** When last seen, rounded to 5 minutes; null if never, or not shared. */
  lastSeenAt?: string | null
  /** The Steam game they are in right now (people you follow only, /api/follows/playing). */
  playing?: string | null
  avatar: string | null
  /** Country code. */
  location?: string | null
  /** The start of what they wrote about themselves. */
  description?: string | null
  ra: boolean
  steam: boolean
  psn: boolean
  /** Only true for a searcher who may see Xbox (an admin, for now). */
  xbox?: boolean
}

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
