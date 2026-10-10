import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { SteamProfile } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useWhenChanged } from '@/hooks/useWhenChanged'

/** The linked Steam profile (persona, avatar, level, what they are playing right now). */
export function useSteamProfile() {
  const { data: session } = useSession()
  const subject = useSubject()
  const steamid = session?.user?.steamid ?? null

  const [profile, setProfile] = useState<SteamProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(withSubject('/api/steam/profile', subject))
      if (!res.ok) throw new Error(`Failed to load Steam profile (${res.status})`)
      setProfile((await res.json()) as SteamProfile)
    } catch (err) {
      console.error('[useSteamProfile]', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [subject])

  // A new account (or none) starts over; state, so while rendering. The load is the effect.
  useWhenChanged([steamid], () => {
    if (!steamid) setProfile(null)
    setError(null)
    setIsLoading(Boolean(steamid))
  })

  useEffect(() => {
    if (!steamid) {
      hasFetched.current = null
      return
    }
    if (hasFetched.current === steamid) return
    hasFetched.current = steamid
    load()
  }, [steamid, load])

  const retry = useCallback(() => {
    setIsLoading(true)
    setError(null)
    load()
  }, [load])

  return { profile, isLoading, error, retry }
}
