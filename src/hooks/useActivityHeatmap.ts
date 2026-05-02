import { RecentAchievement } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useActivityHeatmap() {
  const { data: session } = useSession()
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    setIsLoading(true)
    fetch('/api/getActivityHeatmap')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAchievements(data) })
      .finally(() => setIsLoading(false))
  }, [session?.user?.rausername])

  return { achievements, isLoading }
}
