'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { useActivityHeatmapYear } from '@/hooks/useActivityHeatmapYear'
import { motion } from 'framer-motion'

import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import MainPageHeatmap from './MainPageHeatmap'
import MainPagePointsStats from './MainPagePointsStats'
import MainPageRarest from './MainPageRarest'
import MainPageAbandoned from './MainPageAbandoned'
import MainPageTopGames from './MainPageTopGames'
import MainPageMastery from './MainPageMastery'
import MainPageAlmostThere from './MainPageAlmostThere'
import MainPagePerfectGames from './MainPagePerfectGames'
import MainPageBestPeriod from './MainPageBestPeriod'
import MainPageFavorites from '../main-page-favorites/MainPageFavorites'
import MainPageConsoleNav from './MainPageConsoleNav'
import MainPageGroupsPlaceholder from './MainPageGroupsPlaceholder'

function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`bg-bg-card rounded-xl p-4 flex flex-col gap-3 h-full ${className}`}
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
  const { all, isLoading: gamesLoading } = useGamesData()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const { achievements: yearAch, isLoading: yearLoading } = useActivityHeatmapYear()

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label="Stats & Activity">
      <h2 className="text-xl font-semibold text-text-main">Stats & Activity</h2>

      <div className="flex flex-col gap-4">
        {/* Stats pills */}
        <MainPagePointsStats
          achievements={achievements}
          heatmapAchievements={heatmapData}
          rank={rank}
          isLoading={achLoading || rankLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Row 1: Heatmap | Daily | Groups placeholder */}
          <ChartCard>
            <MainPageHeatmap achievements={heatmapData} isLoading={heatmapLoading} />
          </ChartCard>
          <ChartCard>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">Daily achievements — last 7 days</p>
            <div aria-hidden="true">
              <AchievementsLineChart achievements={achievements} isLoading={achLoading} />
            </div>
          </ChartCard>
          <ChartCard className="flex-1">
            <MainPageGroupsPlaceholder />
          </ChartCard>

          {/* Row 2: [Active | Rarest | Abandoned] | [col3: Perfect alone] */}
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
          <ChartCard>
            <MainPagePerfectGames games={all} isLoading={gamesLoading} />
          </ChartCard>

          {/* Row 3: Almost There (col1) | Mastery (col2) | Pinned (col3 row-span-2) */}
          <ChartCard>
            <MainPageAlmostThere games={all} isLoading={gamesLoading} />
          </ChartCard>
          <ChartCard>
            <MainPageMastery awards={awards} isLoading={awardsLoading} />
          </ChartCard>
          <ChartCard className="lg:row-span-2">
            <MainPageFavorites />
          </ChartCard>

          {/* Row 4: Best Performance (col1) | Console Nav (col2) | Pinned continues */}
          <ChartCard>
            <MainPageBestPeriod
              achievements={heatmapData}
              yearAchievements={yearAch}
              isLoading={heatmapLoading}
              yearLoading={yearLoading}
            />
          </ChartCard>
          <ChartCard>
            <MainPageConsoleNav />
          </ChartCard>

        </div>
      </div>
    </section>
  )
}
