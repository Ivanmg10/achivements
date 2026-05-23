'use client'

import { useState, useEffect } from 'react'
import { useStreakData } from '@/hooks/useStreakData'
import { useLanguage } from '@/context/LanguageContext'
import { Streak } from '@/types/types'
import Spinner from '@/components/main-spinner/Spinner'
import StreakStatsBanner from './streak-stats-banner/StreakStatsBanner'
import StreakChart from './streak-chart/StreakChart'
import StreakList from './streak-list/StreakList'

export default function StreakPage() {
  const { streaks, activeStreak, bestStreak, isLoading } = useStreakData()
  const { T } = useLanguage()
  const [selectedStreak, setSelectedStreak] = useState<Streak | null>(null)

  useEffect(() => {
    if (streaks.length && !selectedStreak) {
      setSelectedStreak(activeStreak ?? bestStreak)
    }
  // only run when streaks first populate
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaks.length])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={45} />
      </div>
    )
  }

  if (!streaks.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
        <p className="text-text-main text-lg font-semibold">{T.streak.noData}</p>
        <p className="text-text-secondary text-sm">{T.streak.noDataSub}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 max-w-7xl mx-auto w-full py-6">
      <StreakStatsBanner
        activeStreak={activeStreak}
        bestStreak={bestStreak}
        totalStreaks={streaks.length}
      />
      <StreakChart
        streaks={streaks}
        selectedStreak={selectedStreak}
        onSelect={setSelectedStreak}
      />
      <StreakList selectedStreak={selectedStreak} />
    </div>
  )
}
