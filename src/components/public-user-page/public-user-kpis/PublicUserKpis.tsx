'use client'

import { useMemo } from 'react'
import { IconCalendarEvent, IconCalendarMonth, IconCalendarWeek, IconChartLine, IconFlame, IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import { activityKpis } from '@/utils/utils'
import UserVaultStat from '@/components/user-page/user-vault-stat/UserVaultStat'

/**
 * A user's pace at a glance, every platform together: unlocks today, in the
 * last week and this month, the daily average, and the current and best streak.
 * Read from the year of activity the streak already loads, so it costs no call.
 */
export default function PublicUserKpis() {
  const { T, lang } = useLanguage()
  const { achievements, activeStreak, bestStreak, now, isLoading } = useStreakData()
  const kpis = useMemo(() => activityKpis(achievements, now), [achievements, now])

  if (isLoading) {
    return (
      <div aria-busy="true" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <span className="sr-only">{T.userProfile.loadingActivity}</span>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-card bg-bg-main animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    )
  }

  const streak = activeStreak?.days ?? 0
  const days = (n: number) => T.userProfile.days.replace('{n}', n.toLocaleString(lang))

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <UserVaultStat icon={<IconCalendarEvent size={18} />} label={T.userProfile.today} value={kpis.today} accent="text-text-main" />
      <UserVaultStat icon={<IconCalendarWeek size={18} />} label={T.userProfile.week} value={kpis.week} accent="text-text-main" />
      <UserVaultStat icon={<IconCalendarMonth size={18} />} label={T.userProfile.month} value={kpis.month} accent="text-text-main" />
      <UserVaultStat
        icon={<IconChartLine size={18} />}
        label={T.userProfile.perDay}
        value={kpis.avgPerDay}
        display={kpis.avgPerDay.toLocaleString(lang, { maximumFractionDigits: 1 })}
        sub={T.userProfile.last30Days}
        accent="text-text-main"
      />
      <UserVaultStat
        icon={<IconFlame size={18} />}
        label={T.userProfile.streak}
        value={streak}
        display={days(streak)}
        accent={streak > 0 ? 'text-accent' : 'text-text-secondary'}
      />
      <UserVaultStat
        icon={<IconTrophy size={18} />}
        label={T.userProfile.bestStreak}
        value={bestStreak?.days ?? 0}
        display={days(bestStreak?.days ?? 0)}
        accent="text-text-main"
      />
    </dl>
  )
}
