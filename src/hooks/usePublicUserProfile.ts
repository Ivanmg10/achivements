import { useEffect, useRef, useState } from 'react'
import { RetroAchievementsUserProfile } from '@/types/types'

export function usePublicUserProfile(raUsername: string) {
  const [profile, setProfile] = useState<RetroAchievementsUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!raUsername || hasFetched.current) return
    hasFetched.current = true
    setIsLoading(true)
    fetch(`/api/public/user/profile?u=${encodeURIComponent(raUsername)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        if (data?.User) setProfile(data)
        else setError(true)
        setIsLoading(false)
      })
      .catch(() => {
        setError(true)
        setIsLoading(false)
      })
  }, [raUsername])

  return { profile, isLoading, error }
}
