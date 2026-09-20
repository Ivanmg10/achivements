import { useEffect, useRef, useState } from 'react'
import { RecentAchievement } from '@/types/types'

export function usePublicUserAchievements(raUsername: string) {
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!raUsername || fetchedFor.current === raUsername) return
    fetchedFor.current = raUsername
    setAchievements([])
    setIsLoading(true)
    fetch(`/api/public/user/recent?u=${encodeURIComponent(raUsername)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((data) => {
        setAchievements(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch(() => {
        setAchievements([])
        setIsLoading(false)
      })
  }, [raUsername])

  return { achievements, isLoading }
}
