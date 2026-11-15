import { useMemo } from 'react'
import { useActivityHeatmapYear as useYearFeed } from '@/context/ActivityHeatmapYearContext'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'

/**
 * The year of unlocks across every linked platform — what the streak, the
 * heatmap and the activity charts are counted from — without the games on the
 * consoles unticked in preferences. A day only spent on a hidden console is no
 * longer a day in the streak: what the person chose not to see is not counted.
 */
export function useActivityHeatmapYear() {
  const feed = useYearFeed()
  const { isShown, filtering, isLoading: filterLoading } = useConsoleVisibility()
  const achievements = useMemo(() => (filtering ? feed.achievements.filter(isShown) : feed.achievements), [feed.achievements, filtering, isShown])
  // Loading until the filter is final too: counting before it, the streak changed once the library landed.
  return { ...feed, achievements, isLoading: feed.isLoading || filterLoading }
}
