'use client'

import { useState, useCallback } from 'react'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { SectionFallback } from '@/components/ui/SectionFallback'

import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import GamesPlayedPieChart from '@/components/games-played-pie-chart/GamesPlayedPieChart'
import MainPageHeatmap from './MainPageHeatmap'
import MainPagePointsStats from './MainPagePointsStats'
import MainPageRarest from './MainPageRarest'
import MainPageAbandoned from './MainPageAbandoned'
import MainPageTopGames from './MainPageTopGames'
import MainPageMastery from './MainPageMastery'
import MainPageCompletionDist from './MainPageCompletionDist'
import MainPageAlmostThere from './MainPageAlmostThere'
import MainPagePerfectGames from './MainPagePerfectGames'

function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-bg-card rounded-xl p-4 flex flex-col gap-3 ${className}`}>
      {children}
    </div>
  )
}

export default function MainPageCharts() {
  const { achievements, isLoading: achLoading, error: achError, refetch: refetchAch } = useRecentAchievements()
  const { achievements: heatmapData, isLoading: heatmapLoading, error: heatmapError, refetch: refetchHeatmap } = useActivityHeatmap()
  const { listGames: playing, isLoading: playingLoading, error: playingError, refetch: refetchPlaying } = useGamesInProgressPreview()
  const { all, softcore, hardcore, error: chartError, refetch: refetchChart } = useGamesData()
  const { rank, isLoading: rankLoading, error: rankError, refetch: refetchRank } = useUserRank()
  const { awards, isLoading: awardsLoading, error: awardsError, refetch: refetchAwards } = useUserAwards()

  const [abandonedError, setAbandonedError] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [chartMode, setChartMode] = useState<'softcore' | 'hardcore'>('softcore')

  const anyError = achError || heatmapError || chartError || playingError || rankError || awardsError || abandonedError

  const refetchAll = useCallback(() => {
    refetchAch()
    refetchHeatmap()
    refetchChart()
    refetchPlaying()
    refetchRank()
    refetchAwards()
    setAbandonedError(false)
    setResetKey((k) => k + 1)
  }, [refetchAch, refetchHeatmap, refetchChart, refetchPlaying, refetchRank, refetchAwards])

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label="Stats & Activity">
      <h2 className="text-xl font-semibold text-text-main">Stats & Activity</h2>

      <SectionFallback error={anyError} onRefresh={refetchAll}>
        <div className="flex flex-col gap-4">
          {/* Row 1: Pills */}
          <MainPagePointsStats
            achievements={achievements}
            heatmapAchievements={heatmapData}
            rank={rank}
            isLoading={achLoading || rankLoading}
          />

          {/* Row 2-3: 3-column layout
              Left:   Heatmap + Line chart stacked
              Center: Pie chart + Most Active + Rarest + Abandoned stacked
              Right:  Perfect Games (top half) + Mastery (bottom half)
          */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-stretch">

            {/* Left col: Heatmap + Line chart */}
            <div className="flex flex-col gap-4">
              <ChartCard className="flex-1">
                <MainPageHeatmap achievements={heatmapData} isLoading={heatmapLoading} onRefresh={refetchHeatmap} />
              </ChartCard>
              <ChartCard className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-text-secondary">Daily achievements — last 7 days</p>
                <div aria-hidden="true">
                  <AchievementsLineChart achievements={achievements} isLoading={achLoading} />
                </div>
              </ChartCard>
            </div>

            {/* Center col: Pie chart + 3 list cards */}
            <div className="flex flex-col gap-4">
              <ChartCard>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-text-secondary">Games by console</p>
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={() => setChartMode('softcore')}
                      aria-pressed={chartMode === 'softcore'}
                      className={`text-xs px-2 py-0.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${chartMode === 'softcore' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
                    >SC</button>
                    <button
                      onClick={() => setChartMode('hardcore')}
                      aria-pressed={chartMode === 'hardcore'}
                      className={`text-xs px-2 py-0.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${chartMode === 'hardcore' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
                    >HC</button>
                  </div>
                </div>
                <div aria-hidden="true" className="flex-1 flex min-h-0">
                  <GamesPlayedPieChart games={chartMode === 'softcore' ? softcore : hardcore} />
                </div>
              </ChartCard>
              <ChartCard className="flex-1">
                <MainPageTopGames achievements={achievements} />
              </ChartCard>
              <ChartCard className="flex-1">
                <MainPageRarest achievements={achievements} />
              </ChartCard>
              <ChartCard className="flex-1">
                <MainPageAbandoned
                  playing={playing}
                  isLoading={playingLoading}
                  resetKey={resetKey}
                  onError={setAbandonedError}
                />
              </ChartCard>
            </div>

            {/* Right col: Perfect Games + Mastery stacked 50/50 */}
            <div className="flex flex-col gap-4">
              <ChartCard className="flex-1">
                <MainPagePerfectGames games={all} />
              </ChartCard>
              <ChartCard className="flex-1">
                <MainPageMastery awards={awards} isLoading={awardsLoading} />
              </ChartCard>
            </div>

          </div>

          {/* Row 4: Completion distribution + Almost there */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard>
              <MainPageCompletionDist games={all} />
            </ChartCard>
            <ChartCard>
              <MainPageAlmostThere games={all} />
            </ChartCard>
          </div>
        </div>
      </SectionFallback>
    </section>
  )
}
