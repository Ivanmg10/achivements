'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { useTopTenUsers } from '@/hooks/useTopTenUsers'
import { useActivityHeatmapYear } from '@/hooks/useActivityHeatmapYear'
import { motion } from 'framer-motion'

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
import MainPageTopTen from './MainPageTopTen'
import MainPageBestPeriod from './MainPageBestPeriod'
import MainPageFavorites from '../main-page-favorites/MainPageFavorites'

function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`bg-bg-card rounded-xl p-4 flex flex-col gap-3 ${className}`}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function MainPageCharts() {
  const { data: session } = useSession()
  const { achievements, isLoading: achLoading } = useRecentAchievements()
  const { achievements: heatmapData, isLoading: heatmapLoading } = useActivityHeatmap()
  const { listGames: playing, isLoading: playingLoading } = useGamesInProgressPreview()
  const { all, softcore, hardcore, isLoading: gamesLoading } = useGamesData()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const { topTen, isLoading: topTenLoading } = useTopTenUsers()
  const { achievements: yearAch, isLoading: yearLoading } = useActivityHeatmapYear()

  const [chartMode, setChartMode] = useState<'softcore' | 'hardcore'>('softcore')

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label="Stats & Activity">
      <h2 className="text-xl font-semibold text-text-main">Stats & Activity</h2>

      <div className="flex flex-col gap-4">
        {/* Row 1: Pills */}
        <MainPagePointsStats
          achievements={achievements}
          heatmapAchievements={heatmapData}
          rank={rank}
          isLoading={achLoading || rankLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Row 2 */}
          <ChartCard>
            <MainPageHeatmap achievements={heatmapData} isLoading={heatmapLoading} />
          </ChartCard>
          <ChartCard>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">Daily achievements — last 7 days</p>
            <div aria-hidden="true">
              <AchievementsLineChart achievements={achievements} isLoading={achLoading} />
            </div>
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
              <GamesPlayedPieChart games={chartMode === 'softcore' ? softcore : hardcore} isLoading={gamesLoading} />
            </div>
          </ChartCard>

          {/* Row 3 */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <ChartCard>
              <MainPageTopGames achievements={achievements} isLoading={achLoading} />
            </ChartCard>
            <ChartCard>
              <MainPageRarest achievements={achievements} isLoading={achLoading} />
            </ChartCard>
            <ChartCard>
              <MainPageAbandoned
                playing={playing}
                isLoading={playingLoading}
              />
            </ChartCard>
          </div>
          <div className="flex flex-col gap-4">
            <ChartCard className="flex-1">
              <MainPagePerfectGames games={all} isLoading={gamesLoading} />
            </ChartCard>
            <ChartCard className="flex-1">
              <MainPageMastery awards={awards} isLoading={awardsLoading} />
            </ChartCard>
          </div>

          {/* Row 4 col 1-2 */}
          <ChartCard>
            <MainPageCompletionDist games={all} isLoading={gamesLoading} />
          </ChartCard>
          <ChartCard>
            <MainPageAlmostThere games={all} isLoading={gamesLoading} />
          </ChartCard>

          {/* Col 3 row-span-2 */}
          <ChartCard className="lg:row-span-2">
            <MainPageFavorites />
          </ChartCard>

          {/* Row 5 col 1-2 */}
          <ChartCard>
            <MainPageTopTen
              topTen={topTen}
              isLoading={topTenLoading}
              currentUsername={session?.user?.rausername}
            />
          </ChartCard>
          <ChartCard>
            <MainPageBestPeriod
              achievements={heatmapData}
              yearAchievements={yearAch}
              isLoading={heatmapLoading}
              yearLoading={yearLoading}
            />
          </ChartCard>

        </div>
      </div>
    </section>
  )
}
