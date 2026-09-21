import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { SteamProfile } from '@/types/steam'

/** The linked Steam profile (persona, avatar, level, what they are playing right now). */
export function useSteamProfile() {
  const { data: session } = useSession()
  const steamid = session?.user?.steamid ?? null

  const [profile, setProfile] = useState<SteamProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/steam/profile')
      if (!res.ok) throw new Error(`Failed to load Steam profile (${res.status})`)
      setProfile((await res.json()) as SteamProfile)
    } catch (err) {
      console.error('[useSteamProfile]', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!steamid) {
      hasFetched.current = null
      setProfile(null)
      setError(null)
      return
    }
    if (hasFetched.current === steamid) return
    hasFetched.current = steamid
    load()
  }, [steamid, load])

  return { profile, isLoading, error, retry: load }
}
