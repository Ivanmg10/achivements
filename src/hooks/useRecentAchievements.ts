import { RecentAchievement } from '@/types/types'
import { getRecentAchievements } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useRecentAchievements() {
  const { data: session } = useSession()
  const [achievements, setAchievements] = useState<RecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!session?.user?.rausername) { setIsLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    setIsLoading(true)
    getRecentAchievements(session, setAchievements).finally(() => setIsLoading(false))
  }, [session?.user?.rausername])

  return { achievements, isLoading }
}
