'use client'

import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import MainPagePeriodStats from '../../main-page-period-stats/MainPagePeriodStats'

/**
 * Xbox's stat pills, like PSN's: no points, so today / week / month count
 * achievements; the gamerscore takes RA's global rank slot. The streak is
 * within the 60-day window the achievements come from.
 */
export default function MainPageXboxStats({
  achievements,
  streak,
  isLoading,
}: {
  /** The last 60 days of achievements, in RA's shape (xboxToRecentAchievement). */
  achievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak: number
  isLoading?: boolean
}) {
  const { T, lang } = useLanguage()
  const { summary, error } = useXboxSummary()
  // Its pills are in the row from the start: arriving late, they pushed every other one aside.
  const waiting = !summary && !error
  const shown = summary || waiting
  const noun = T.xbox.achievements.toLowerCase()

  return (
    <MainPagePeriodStats
      achievements={achievements}
      streak={streak}
      isLoading={isLoading}
      unit={() => noun}
      before={[{
        label: T.xbox.gamerscore,
        figure: shown ? { label: T.xbox.gamerscore, value: summary?.gamerscore.toLocaleString(lang) ?? '', sub: 'Xbox', tone: 'success', loading: waiting } : null,
      }]}
      after={[{
        label: T.xbox.achievements,
        figure: shown ? { label: T.xbox.achievements, value: summary?.achievementsUnlocked.toLocaleString(lang) ?? '', sub: T.xbox.total, loading: waiting } : null,
      }]}
    />
  )
}
