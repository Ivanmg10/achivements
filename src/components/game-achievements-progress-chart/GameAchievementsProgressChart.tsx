'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import type { InsightAchievement } from '@/utils/gameInsights'
import { groupGameAchievementsByPeriod } from '@/utils/utils'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { LineChartSkeleton } from '@/components/ui/ChartSkeleton'
import GameAchievementsProgressChartTooltip from './game-achievements-progress-chart-tooltip/GameAchievementsProgressChartTooltip'

type Period = 'week' | 'month'

const PLOT_HEIGHT = 'h-[208px]'

// recharts is the heaviest thing on the page: it arrives when there is a line to draw, with the room kept meanwhile.
const AchievementsLinePlot = dynamic(() => import('@/components/achivements-line-chart/achievements-line-plot/AchievementsLinePlot'), {
  loading: () => <LineChartSkeleton />,
})
// Downloaded the first time a point is clicked, not with the card. `loading` gives it its
// own Suspense boundary: without one the download suspends the whole page (the home
// skeleton flashes).
const GameAchievementsProgressChartModal = dynamic(
  () => import('./game-achievements-progress-chart-modal/GameAchievementsProgressChartModal'),
  { loading: () => null },
)

/**
 * A game's unlocks per week or month, on the same line as the home's week.
 * Clicking a point lists what was unlocked in that period.
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

  const periodTitle = (start: number) =>
    period === 'week'
      ? T.gameExpanded.weekOf.replace('{date}', new Date(start).toLocaleDateString(lang, { day: 'numeric', month: 'short' }))
      : new Date(start).toLocaleDateString(lang, { month: 'long', year: 'numeric' })

  function tick(label: string) {
    const bucket = data.find((d) => d.label === label)
    return bucket ? new Date(bucket.start).toLocaleDateString(lang, period === 'week' ? { day: 'numeric', month: 'short' } : { month: 'short' }) : label
  }

  function handleSelect(label: string) {
    const bucket = data.find((d) => d.label === label)
    if (!bucket?.count) return
    setSelected({ title: periodTitle(bucket.start), items: bucket.items })
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
        <div className={PLOT_HEIGHT}><LineChartSkeleton /></div>
      ) : total === 0 ? (
        <div className="flex items-center justify-center h-52 text-text-secondary text-sm text-center px-4">
          {T.gameExpanded.noActivity}
        </div>
      ) : (
        <div className={PLOT_HEIGHT}>
          <AchievementsLinePlot data={data} x="label" y="count" tick={tick} tooltip={<GameAchievementsProgressChartTooltip title={periodTitle} />} onPick={handleSelect} />
        </div>
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
