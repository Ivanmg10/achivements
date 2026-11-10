'use client'

import type { RecentAchievement } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import MainPagePeriodStats from '../../main-page-period-stats/MainPagePeriodStats'

/**
 * Steam's stat pills. Steam has no points, so today / week / month count
 * unlocks instead; the Steam level takes RA's global rank slot, and two
 * weeks' playtime replaces nothing RA has. The streak is within the 60-day
 * activity window the unlocks come from.
 */
export default function MainPageSteamStats({
  achievements,
  streak,
  games,
  isLoading,
}: {
  achievements: RecentAchievement[]
  /** Current streak in days, the top bar's. */
  streak: number
  games: SteamGameProgress[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const { profile, error } = useSteamProfile()
  // Its pill is in the row from the start: arriving late, it pushed every other one aside.
  const levelWaiting = !profile && !error
  const hours2w = Math.round(games.reduce((sum, g) => sum + (g.playtime2Weeks ?? 0), 0) / 60)
  const unlocks = T.lineChart.achievements

  return (
    <MainPagePeriodStats
      achievements={achievements}
      streak={streak}
      isLoading={isLoading}
      unit={() => unlocks}
      before={[{
        label: T.steam.level,
        figure: levelWaiting || profile?.level != null ? { label: T.steam.level, value: profile?.level ?? '', sub: 'Steam', loading: levelWaiting } : null,
      }]}
      after={[{
        label: T.steam.last2Weeks,
        figure: { label: T.steam.last2Weeks, value: `${hours2w}${T.steam.hoursShort}`, sub: T.steam.playtime },
      }]}
    />
  )
}
