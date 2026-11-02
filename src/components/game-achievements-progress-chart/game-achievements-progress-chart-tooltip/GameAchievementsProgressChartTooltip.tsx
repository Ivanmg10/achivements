'use client'

import { useLanguage } from '@/context/LanguageContext'
import { LINE_TOOLTIP } from '@/components/achivements-line-chart/achivements-line-chart-tooltip/AchivementsLineChartTooltip'

/** The week or month under the pointer: which one, and how many were unlocked in it. */
export default function GameAchievementsProgressChartTooltip({
  active,
  payload,
  title,
}: {
  active?: boolean
  payload?: { payload: { start: number; count: number } }[]
  title: (start: number) => string
}) {
  const { T } = useLanguage()
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) return null

  return (
    <div className={LINE_TOOLTIP}>
      <span className="font-semibold text-text-main first-letter:uppercase">{title(point.start)}</span>
      <span className="text-text-secondary">{point.count === 1 ? T.lineChart.oneAchievement : `${point.count} ${T.lineChart.achievements}`}</span>
    </div>
  )
}
