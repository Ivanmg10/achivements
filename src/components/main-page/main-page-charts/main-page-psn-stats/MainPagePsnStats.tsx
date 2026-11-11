'use client'

import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import MainPagePeriodStats from '../../main-page-period-stats/MainPagePeriodStats'

/**
 * PSN's stat pills, like Steam's: no points, so today / week / month count
 * trophies; the trophy level takes RA's global rank slot, and the platinum
 * total stands where Steam shows playtime (Sony reports none).
 * The streak is within the 60-day window the trophies come from.
 */
export default function MainPagePsnStats({
  achievements,
  streak,
  isLoading,
}: {
  /** The last 60 days of trophies, in RA's shape (psnToRecentAchievement). */
  achievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak: number
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const { summary, error } = usePsnSummary()
  // Its pills are in the row from the start: arriving late, they pushed every other one aside.
  const waiting = !summary && !error
  const shown = summary || waiting
  const trophies = T.psn.trophies.toLowerCase()

  return (
    <MainPagePeriodStats
      achievements={achievements}
      streak={streak}
      isLoading={isLoading}
      unit={() => trophies}
      before={[{
        label: T.psn.level,
        figure: shown ? { label: T.psn.level, value: summary?.trophyLevel ?? '', sub: 'PlayStation', loading: waiting } : null,
      }]}
      after={[{
        label: T.psn.platinum,
        figure: shown ? { label: T.psn.platinum, value: summary?.earned.platinum ?? '', sub: T.psn.total, tone: 'platinum', loading: waiting } : null,
      }]}
    />
  )
}
