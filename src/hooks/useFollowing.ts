import { useCallback, useEffect, useState } from 'react'
import type { UserSearchResult } from '@/hooks/useUserSearch'

type Outcome = { users: UserSearchResult[] } | { error: true }

async function request(): Promise<Outcome> {
  try {
    const res = await fetch('/api/follows')
    if (!res.ok) throw new Error(`follows ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Unexpected follows response')
    return { users: data as UserSearchResult[] }
  } catch (err) {
    console.error('[useFollowing]', err)
    return { error: true }
  }
}

/** The users the signed-in user follows, newest first. `retry` asks again after a failure. */
export function useFollowing() {
  const [users, setUsers] = useState<UserSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const settle = useCallback((outcome: Outcome) => {
    if ('error' in outcome) setError(true)
    else setUsers(outcome.users)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let current = true
    request().then((outcome) => {
      if (current) settle(outcome)
    })
    return () => {
      current = false
    }
  }, [settle])

  const retry = useCallback(() => {
    setIsLoading(true)
    setError(false)
    request().then(settle)
  }, [settle])

  return { users, isLoading, error, retry }
}
