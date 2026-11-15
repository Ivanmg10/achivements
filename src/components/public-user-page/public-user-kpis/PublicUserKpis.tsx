'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import { activityKpis, decimal, plural } from '@/utils/utils'
import { streakInk, streakTier } from '@/utils/streakTier'
import Figure from '@/components/ui/Figure'
import PublicUserKpisSkeleton, { KPIS_ROW } from '../public-user-kpis-skeleton/PublicUserKpisSkeleton'

/**
 * A user's pace at a glance, every platform together: unlocks today, in the
 * last week and this month, the daily average, and the current and best
 * streak, as one row of bare figures with the mark between them (MejPerfil 9,
 * #130). A zero is quieter than the figures beside it. Read from the year of
 * activity the streak already loads, so it costs no call.
 */
export default function PublicUserKpis() {
  const { T, lang } = useLanguage()
  const { achievements, activeStreak, bestStreak, now, isLoading } = useStreakData()
  const kpis = useMemo(() => activityKpis(achievements, now), [achievements, now])

  if (isLoading) return <PublicUserKpisSkeleton />

  const streak = activeStreak?.days ?? 0
  const best = bestStreak?.days ?? 0
  const days = (n: number) => T.userProfile.days.replace('{n}', n.toLocaleString(lang))
  const unit = (n: number) => plural(n, T.plurals.achievementsWord, lang)
  const tone = (n: number) => (n > 0 ? 'main' : 'muted')

  return (
    <dl className={`${KPIS_ROW} enter-cards`}>
      <Figure term label={T.userProfile.today} value={kpis.today} sub={unit(kpis.today)} tone={tone(kpis.today)} />
      <Figure term label={T.userProfile.week} value={kpis.week} sub={unit(kpis.week)} tone={tone(kpis.week)} />
      <Figure term label={T.userProfile.month} value={kpis.month} sub={unit(kpis.month)} tone={tone(kpis.month)} />
      <Figure term label={T.userProfile.perDay} value={decimal(kpis.avgPerDay, lang)} sub={T.userProfile.last30Days} tone={tone(kpis.avgPerDay)} />
      <Figure
        term
        label={T.userProfile.streak}
        value={days(streak)}
        sub={streak > 0 ? T.pointsStats.active : T.pointsStats.noStreak}
        tone={tone(streak)}
        color={streak > 0 ? streakInk(streakTier(streak)) : undefined}
      />
      <Figure term label={T.userProfile.bestStreak} value={days(best)} tone={tone(best)} />
    </dl>
  )
}
