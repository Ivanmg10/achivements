import { useCallback, useEffect, useState } from 'react'
import type { FriendOverview } from '@/utils/friends'

/**
 * The people who follow you, as the Following page's cards show them (public
 * profiles only, newest first), read once `enabled` turns on. Only you ever
 * see this list. `retry` after a failure asks again.
 */
export function useFollowers(enabled: boolean) {
  const [followers, setFollowers] = useState<FriendOverview[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let current = true
    fetch('/api/follows/overview?who=followers', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`followers ${res.status}`)
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('followers: not a list')
        return data as FriendOverview[]
      })
      .then((data) => {
        if (current) setFollowers(data)
      })
      .catch((err) => {
        console.error('[useFollowers]', err)
        if (current) setFailed(true)
      })
    return () => {
      current = false
    }
  }, [enabled, attempt])

  const retry = useCallback(() => {
    setFailed(false)
    setFollowers(null)
    setAttempt((n) => n + 1)
  }, [])

  return { followers, isLoading: enabled && followers === null && !failed, error: failed, retry }
}
