import { useMemo } from 'react'
import { useActivityHeatmapYear } from './useActivityHeatmapYear'
import { calcAllStreaks } from '@/utils/utils'
import { Streak } from '@/types/types'

export function useStreakData() {
  const { achievements, isLoading } = useActivityHeatmapYear()

  const streaks = useMemo(() => calcAllStreaks(achievements), [achievements])

  const activeStreak = useMemo((): Streak | null => {
    if (!streaks.length) return null
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    return streaks.find(s => s.end === today || s.end === yesterday) ?? null
  }, [streaks])

  const bestStreak = streaks[0] ?? null

  return { streaks, activeStreak, bestStreak, isLoading }
}
