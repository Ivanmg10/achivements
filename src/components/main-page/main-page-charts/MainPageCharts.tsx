'use client'

import { useState, useCallback } from 'react'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useGamesData } from '@/contexts/GamesDataContext'
import { SectionFallback } from '@/components/ui/SectionFallback'

import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import GamesPlayedPieChart from '@/components/games-played-pie-chart/GamesPlayedPieChart'
import MainPageHeatmap from './MainPageHeatmap'
import MainPagePointsStats from './MainPagePointsStats'
import MainPageRarest from './MainPageRarest'
import MainPageAbandoned from './MainPageAbandoned'
import MainPageTopGames from './MainPageTopGames'

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
  const { softcore, hardcore, error: chartError, refetch: refetchChart } = useGamesData()

  const [abandonedError, setAbandonedError] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [chartMode, setChartMode] = useState<'softcore' | 'hardcore'>('softcore')

  const anyError = achError || heatmapError || chartError || playingError || abandonedError

  const refetchAll = useCallback(() => {
    refetchAch()
    refetchHeatmap()
    refetchChart()
    refetchPlaying()
    setAbandonedError(false)
    setResetKey((k) => k + 1)
  }, [refetchAch, refetchHeatmap, refetchChart, refetchPlaying])

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label="Stats & Activity">
      <h2 className="text-xl font-semibold text-text-main">Stats & Activity</h2>

      <SectionFallback error={anyError} onRefresh={refetchAll}>
        <div className="flex flex-col gap-4">
          {/* Row 1: Points stats */}
          <MainPagePointsStats achievements={achievements} isLoading={achLoading} />

          {/* Row 2: Heatmap + Pie chart + Line chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartCard>
              <MainPageHeatmap achievements={heatmapData} isLoading={heatmapLoading} onRefresh={refetchHeatmap} />
            </ChartCard>
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
            <ChartCard className="md:col-span-2 lg:col-span-1">
              <p className="text-[10px] uppercase tracking-widest text-text-secondary">Achievements / day (7d)</p>
              <div aria-hidden="true">
                <AchievementsLineChart achievements={achievements} isLoading={achLoading} />
              </div>
            </ChartCard>
          </div>

          {/* Row 3: Most played + Rarest + Abandoned */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartCard>
              <MainPageTopGames achievements={achievements} />
            </ChartCard>

            <ChartCard>
              <MainPageRarest achievements={achievements} />
            </ChartCard>

            <ChartCard className="md:col-span-2 lg:col-span-1">
              <MainPageAbandoned
                playing={playing}
                isLoading={playingLoading}
                resetKey={resetKey}
                onError={setAbandonedError}
              />
            </ChartCard>
          </div>
        </div>
      </SectionFallback>
    </section>
  )
}
