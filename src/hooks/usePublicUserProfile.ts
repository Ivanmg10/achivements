import { useCallback, useEffect, useRef, useState } from 'react'
import { RetroAchievementsUserProfile } from '@/types/types'

/**
 * A CheevoVault user's RA profile, for their public page. `error` tells apart a user RA
 * does not know ('missing') from RA not answering ('failed', worth a retry):
 * saying "not found" when RA was only down sends visitors away for nothing.
 */
export function usePublicUserProfile(username: string) {
  const [profile, setProfile] = useState<RetroAchievementsUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<'missing' | 'failed' | null>(null)
  const fetchedFor = useRef<string | null>(null)

  const load = useCallback((u: string) => {
    setProfile(null)
    setError(null)
    setIsLoading(true)
    fetch(`/api/public/user/profile?user=${encodeURIComponent(u)}`)
      .then((r) => {
        if (r.status === 404) return null
        if (!r.ok) throw new Error(`profile ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (data?.User) setProfile(data)
        else setError('missing')
      })
      .catch((err) => {
        console.error('[usePublicUserProfile]', err)
        setError('failed')
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!username || fetchedFor.current === username) return
    fetchedFor.current = username
    load(username)
  }, [username, load])

  const retry = useCallback(() => load(username), [load, username])

  return { profile, isLoading, error, retry }
}
