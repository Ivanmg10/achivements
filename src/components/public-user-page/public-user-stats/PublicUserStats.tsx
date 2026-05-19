'use client'

import { RecentAchievement, UserRankAndScore, UserAwards, RetroAchievementsGameCompleted } from '@/types/types'
import { calcStreak } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import { StatPill } from '@/components/ui/StatPill'
import { ChartCard } from '@/components/ui/ChartCard'

import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import MainPageHeatmap from '@/components/main-page/main-page-charts/MainPageHeatmap'
import MainPageTopGames from '@/components/main-page/main-page-charts/MainPageTopGames'
import MainPageRarest from '@/components/main-page/main-page-charts/MainPageRarest'
import MainPageMastery from '@/components/main-page/main-page-charts/MainPageMastery'
import MainPageBestPeriod from '@/components/main-page/main-page-charts/MainPageBestPeriod'
import MainPagePerfectGames from '@/components/main-page/main-page-charts/MainPagePerfectGames'

interface PublicUserStatsProps {
  achievements: RecentAchievement[]
  rank: UserRankAndScore | null
  awards: UserAwards | null
  completed: RetroAchievementsGameCompleted[]
  isLoading: boolean
  awardsLoading: boolean
  completedLoading: boolean
}

export default function PublicUserStats({
  achievements,
  rank,
  awards,
  completed,
  isLoading,
  awardsLoading,
  completedLoading,
}: PublicUserStatsProps) {
  const { T } = useLanguage()

  const now = new Date()
  const todayKey = now.toISOString().split('T')[0]
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  let ptsToday = 0, achToday = 0, pts7d = 0, hc7d = 0, sc7d = 0, ach7d = 0
  for (const a of achievements) {
    const d = new Date(a.Date)
    const hc = a.HardcoreMode === '1'
    if (a.Date.startsWith(todayKey)) { ptsToday += a.Points; achToday++ }
    if (d >= weekAgo) {
      pts7d += a.Points; ach7d++
      if (hc) hc7d += a.Points; else sc7d += a.Points
    }
  }

  const streak = calcStreak(achievements)
  const todaySub = ptsToday === 0 ? 'no activity' : `${achToday} achievement${achToday !== 1 ? 's' : ''}`

  const all = completed
  const hardcore = completed.filter((g) => g.HardcoreMode === '1')
  const softcore = completed.filter((g) => g.HardcoreMode === '0')

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label={T.cards.statsActivity}>
      <h2 className="text-xl font-semibold text-text-main">{T.cards.statsActivity}</h2>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        {isLoading ? (
          ['Today', 'This week', 'HC this week', 'SC this week', 'Global rank', 'Streak'].map((l) => (
            <StatPill key={l} label={l} value="—" accent="text-text-secondary" />
          ))
        ) : (
          <>
            <StatPill label="Today" value={ptsToday.toLocaleString()} sub={todaySub} accent={ptsToday > 0 ? 'text-warning' : undefined} />
            <StatPill label="This week" value={pts7d.toLocaleString()} sub={`${ach7d} achievement${ach7d !== 1 ? 's' : ''}`} />
            <StatPill label="HC this week" value={hc7d.toLocaleString()} sub="hardcore pts" accent={hc7d > 0 ? 'text-warning' : undefined} />
            <StatPill label="SC this week" value={sc7d.toLocaleString()} sub="softcore pts" accent={sc7d > 0 ? 'text-info' : undefined} />
            {rank?.Rank != null && <StatPill label="Global rank" value={`#${rank.Rank.toLocaleString()}`} sub={`${(rank.Score ?? 0).toLocaleString()} pts`} accent="text-accent" />}
            <StatPill label="Streak" value={`${streak}d`} sub={streak > 0 ? 'active' : 'no streak'} accent={streak >= 7 ? 'text-warning' : streak > 0 ? 'text-success' : undefined} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Row 1: Heatmap | Daily | (no groups — placeholder) */}
          <ChartCard>
            <MainPageHeatmap achievements={achievements} isLoading={isLoading} />
          </ChartCard>
          <ChartCard>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.dailyAchievements}</p>
            <div aria-hidden="true">
              <AchievementsLineChart achievements={achievements} isLoading={isLoading} />
            </div>
          </ChartCard>
          <ChartCard className="flex-1">
            <MainPageMastery
              awards={awards}
              isLoading={awardsLoading}
              unlockedHC={hardcore.reduce((s, g) => s + g.NumAwarded, 0)}
              unlockedSC={softcore.reduce((s, g) => s + g.NumAwarded, 0)}
            />
          </ChartCard>

          {/* Row 2: top games | rarest | perfect */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <ChartCard>
              <MainPageTopGames achievements={achievements} isLoading={isLoading} />
            </ChartCard>
            <ChartCard>
              <MainPageRarest achievements={achievements} isLoading={isLoading} />
            </ChartCard>
          </div>
          <ChartCard>
            <MainPagePerfectGames games={all} isLoading={completedLoading} />
          </ChartCard>

          {/* Row 3: best period full width */}
          <ChartCard className="lg:col-span-3">
            <MainPageBestPeriod
              achievements={achievements}
              yearAchievements={achievements}
              isLoading={isLoading}
              yearLoading={isLoading}
            />
          </ChartCard>

        </div>
      </div>
    </section>
  )
}
