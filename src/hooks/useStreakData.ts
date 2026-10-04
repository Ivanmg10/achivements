import { useMemo, useState } from 'react'
import { useActivityHeatmapYear } from './useActivityHeatmapYear'
import { calcAllStreaks } from '@/utils/utils'
import { Streak } from '@/types/types'

export function useStreakData() {
  const { achievements, isLoading, error, refetch } = useActivityHeatmapYear()
  // Read once, when the page opens: render has to give the same answer every time.
  const [now] = useState(Date.now)

  const streaks = useMemo(() => calcAllStreaks(achievements), [achievements])

  const activeStreak = useMemo((): Streak | null => {
    if (!streaks.length) return null
    const today = new Date(now).toISOString().split('T')[0]
    const yesterday = new Date(now - 86400000).toISOString().split('T')[0]
    return streaks.find(s => s.end === today || s.end === yesterday) ?? null
  }, [streaks, now])

  const bestStreak = streaks[0] ?? null

  return { achievements, streaks, activeStreak, bestStreak, now, isLoading, error, refetch }
}
