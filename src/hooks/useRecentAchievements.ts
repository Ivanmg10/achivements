import { useMemo } from 'react'
import { useRecentAchievements as useRecentFeed } from '@/context/RecentAchievementsContext'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'

/** RA's latest unlocks, without the games on the consoles unticked in preferences. */
export function useRecentAchievements() {
  const feed = useRecentFeed()
  const { isShown, filtering } = useConsoleVisibility()
  const achievements = useMemo(() => (filtering ? feed.achievements.filter(isShown) : feed.achievements), [feed.achievements, filtering, isShown])
  return { ...feed, achievements }
}
