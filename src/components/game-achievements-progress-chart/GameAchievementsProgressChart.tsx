'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import type { InsightAchievement } from '@/utils/gameInsights'
import { groupGameAchievementsByPeriod } from '@/utils/utils'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { ChartSkeleton } from '@/components/ui/ChartSkeleton'

type Period = 'week' | 'month'

const BARS = [45, 70, 30, 90, 55, 20, 80, 60]
const PLOT_HEIGHT = 'h-[208px]'

// recharts is the heaviest thing on the page: it arrives when there is a line to draw, with the room kept meanwhile.
const GameAchievementsProgressPlot = dynamic(
  () => import('./game-achievements-progress-plot/GameAchievementsProgressPlot'),
  { loading: () => <div className={PLOT_HEIGHT}><ChartSkeleton bars={BARS} /></div> },
)
// Downloaded the first time a point is clicked, not with the card. `loading` gives it its
// own Suspense boundary: without one the download suspends the whole page (the home
// skeleton flashes).
const GameAchievementsProgressChartModal = dynamic(
  () => import('./game-achievements-progress-chart-modal/GameAchievementsProgressChartModal'),
  { loading: () => null },
)

/**
 * A game's unlocks per week or month. Clicking a point lists what was unlocked
 * in that period.
 */
export function GameAchievementsProgressChart({
  achievements,
  isLoading,
}: {
  achievements: InsightAchievement[]
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const [period, setPeriod] = useState<Period>('week')
  // Kept after closing, so the modal still has its content while it animates out.
  const [selected, setSelected] = useState<{ title: string; items: InsightAchievement[] } | null>(null)
  const [open, setOpen] = useState(false)
  const data = groupGameAchievementsByPeriod(achievements, period)
  const total = data.reduce((sum, d) => sum + d.count, 0)

  function handleSelect(label: string) {
    const bucket = data.find((d) => d.label === label)
    if (!bucket?.count) return
    const start = new Date(bucket.start)
    const title =
      period === 'week'
        ? T.gameExpanded.weekOf.replace('{date}', start.toLocaleDateString(lang, { day: 'numeric', month: 'short' }))
        : start.toLocaleDateString(lang, { month: 'long', year: 'numeric' })
    setSelected({ title, items: bucket.items })
    setOpen(true)
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-sm font-bold text-text-main">{T.gameExpanded.achievementsOverTime}</p>
        <SegmentedControl
          aria-label={T.gameExpanded.achievementsOverTime}
          size="xs"
          className="shrink-0"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: T.gameExpanded.weekly },
            { value: 'month', label: T.gameExpanded.monthly },
          ]}
        />
      </div>

      {isLoading ? (
        <div className={PLOT_HEIGHT}><ChartSkeleton bars={BARS} /></div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center h-52 text-text-secondary text-sm text-center px-4">
          {T.gameExpanded.noActivity}
        </div>
      ) : (
        <GameAchievementsProgressPlot data={data} onSelect={handleSelect} />
      )}

      <LazyWhenOpened open={open}>
        <GameAchievementsProgressChartModal
          isOpen={open}
          title={selected?.title ?? ''}
          items={selected?.items ?? []}
          onClose={() => setOpen(false)}
        />
      </LazyWhenOpened>
    </div>
  )
}
