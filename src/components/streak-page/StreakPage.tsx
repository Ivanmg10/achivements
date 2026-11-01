'use client'

import { useMemo, useState } from 'react'
import { IconFlame } from '@tabler/icons-react'
import { useStreakData } from '@/hooks/useStreakData'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'
import { countByDay, streakInsights } from '@/utils/utils'
import { SectionFallback } from '@/components/ui/SectionFallback'
import EmptyState from '@/components/empty-state/EmptyState'
import StreakStatsBanner from './streak-stats-banner/StreakStatsBanner'
import StreakChart from './streak-chart/StreakChart'
import StreakList from './streak-list/StreakList'
import StreakPageSkeleton from './streak-page-skeleton/StreakPageSkeleton'
import StreakQuickStats from './streak-quick-stats/StreakQuickStats'
import StreakWeekdays from './streak-weekdays/StreakWeekdays'
import StreakYearHeatmap from './streak-year-heatmap/StreakYearHeatmap'

/**
 * The streak page: the streak going now and the record, the longest streaks
 * as a ranked list, and one of them day by day; picked in the list or on the year, and picked again to let go. On a wide screen the overview and
 * the day by day sit side by side.
 */
export default function StreakPage() {
  const { achievements, streaks, activeStreak, bestStreak, now, isLoading, error, refetch } = useStreakData()
  const { T } = useLanguage()
  const [picked, setPicked] = useState<Streak | null>(null)
  // Nothing is picked until the person picks; the day by day starts on the streak going now, or the best.
  const shownStreak = picked ?? activeStreak ?? bestStreak
  const today = useMemo(() => { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }, [now])
  const byDay = useMemo(() => countByDay(achievements), [achievements])
  const insights = useMemo(() => streakInsights(byDay, streaks, today), [byDay, streaks, today])
  const lastActiveDay = useMemo(() => streaks.reduce<string | null>((last, s) => (!last || s.end > last ? s.end : last), null), [streaks])

  const togglePicked = (streak: Streak) => setPicked((current) => (current?.start === streak.start ? null : streak))

  let body: React.ReactNode
  if (isLoading) body = <StreakPageSkeleton />
  else if (error) body = <SectionFallback error onRefresh={refetch}>{null}</SectionFallback>
  else if (!streaks.length)
    body = <EmptyState icon={<IconFlame className="w-7 h-7" />} title={T.streak.noData} subtitle={T.streak.noDataSub} className="min-h-[50vh]" />
  else
    body = (
      <>
      <StreakStatsBanner activeStreak={activeStreak} bestStreak={bestStreak} lastActiveDay={lastActiveDay} today={today} todayCount={byDay[today] ?? 0} hoursLeft={24 - new Date(now).getHours()}>
        <StreakQuickStats activeDays={insights.activeDays} avgStreak={insights.avgStreak} daysSinceLast={insights.daysSinceLast} longestGap={insights.longestGap} />
      </StreakStatsBanner>
      <div className="grid gap-4 xl:grid-cols-2 enter-cards">
        <div className="flex flex-col gap-4 min-w-0">
          <StreakChart streaks={streaks} selectedStreak={picked} activeStreak={activeStreak} avgStreak={insights.avgStreak} onSelect={togglePicked} />
        </div>
        <div className="min-w-0 flex flex-col">
          {/* Keyed by streak: picking another one starts its calendar on its last day. */}
          <StreakList key={shownStreak?.start ?? 'none'} selectedStreak={shownStreak} today={today} />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2 enter-cards">
        <StreakYearHeatmap byDay={byDay} streaks={streaks} selected={picked} today={today} onSelect={togglePicked} />
        <StreakWeekdays counts={insights.weekdays} />
      </div>
      </>
    )

  return (
    <div className="flex flex-col gap-4 px-3 py-4 w-full mx-auto">
      {/* The hero is the page's top; its title and what it counts stay for screen readers. */}
      <header className="sr-only">
        <h1>{T.streak.title}</h1>
        <p>{T.streak.pageSub}</p>
      </header>
      {body}
    </div>
  )
}
