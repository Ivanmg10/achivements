'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { IconFlame } from '@tabler/icons-react'
import { useStreakData } from '@/hooks/useStreakData'
import { useLanguage } from '@/context/LanguageContext'
import { fadeUp } from '@/lib/animations'
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
 * as bars, and the picked one day by day. On a wide screen the overview and
 * the day by day sit side by side.
 */
export default function StreakPage() {
  const { achievements, streaks, activeStreak, bestStreak, now, isLoading, error, refetch } = useStreakData()
  const { T } = useLanguage()
  const [picked, setPicked] = useState<Streak | null>(null)
  // The picked streak, or the one going now, or the best: never empty once there are streaks.
  const selectedStreak = picked ?? activeStreak ?? bestStreak
  const today = useMemo(() => { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }, [now])
  const byDay = useMemo(() => countByDay(achievements), [achievements])
  const insights = useMemo(() => streakInsights(byDay, streaks, today), [byDay, streaks, today])
  const lastActiveDay = useMemo(() => streaks.reduce<string | null>((last, s) => (!last || s.end > last ? s.end : last), null), [streaks])

  let body: React.ReactNode
  if (isLoading) body = <StreakPageSkeleton />
  else if (error) body = <SectionFallback error onRefresh={refetch}>{null}</SectionFallback>
  else if (!streaks.length)
    body = <EmptyState icon={<IconFlame className="w-7 h-7" />} title={T.streak.noData} subtitle={T.streak.noDataSub} className="min-h-[50vh]" />
  else
    body = (
      <>
      <StreakQuickStats activeDays={insights.activeDays} avgStreak={insights.avgStreak} daysSinceLast={insights.daysSinceLast} longestGap={insights.longestGap} />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5 min-w-0">
          <StreakStatsBanner activeStreak={activeStreak} bestStreak={bestStreak} totalStreaks={streaks.length} lastActiveDay={lastActiveDay} />
          <StreakChart streaks={streaks} selectedStreak={selectedStreak} onSelect={setPicked} />
        </div>
        <div className="min-w-0 flex flex-col">
          {/* Keyed by streak: picking another one starts its calendar on its last day. */}
          <StreakList key={selectedStreak?.start ?? 'none'} selectedStreak={selectedStreak} />
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <StreakYearHeatmap byDay={byDay} streaks={streaks} selected={selectedStreak} today={today} onSelect={setPicked} />
        <StreakWeekdays counts={insights.weekdays} />
      </div>
      </>
    )

  return (
    <motion.div className="flex flex-col gap-5 px-4 py-6 w-full lg:max-w-[98%] mx-auto" variants={fadeUp} initial="hidden" animate="visible">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-main">{T.streak.title}</h1>
        <p className="text-sm text-text-secondary">{T.streak.pageSub}</p>
      </header>
      {body}
    </motion.div>
  )
}
