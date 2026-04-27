import { RecentAchievement } from '@/types/types'
import { getRecentAchievements } from '@/utils/apiCallsUtils'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

export function useRecentAchievements() {
  const { data: session } = useSession()
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!session?.user?.rausername || hasFetched.current) return
    hasFetched.current = true
    getRecentAchievements(session, setRecentAchievements)
  }, [session?.user?.rausername])

  return recentAchievements
}
