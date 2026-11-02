import { useMemo, useState } from 'react'
import { useActivityHeatmapYear } from './useActivityHeatmapYear'
import { activeStreak as activeOf, calcAllStreaks } from '@/utils/streaks'
import { Streak } from '@/types/types'

export function useStreakData() {
  const { achievements, xboxAchievements, xboxLoading, isLoading, error, refetch } = useActivityHeatmapYear()
  // Read once, when the page opens: render has to give the same answer every time.
  const [now] = useState(Date.now)

  const streaks = useMemo(() => calcAllStreaks(achievements), [achievements])

  const activeStreak = useMemo((): Streak | null => activeOf(streaks, now), [streaks, now])

  const bestStreak = streaks[0] ?? null

  return { achievements, xboxAchievements, xboxLoading, streaks, activeStreak, bestStreak, now, isLoading, error, refetch }
}
