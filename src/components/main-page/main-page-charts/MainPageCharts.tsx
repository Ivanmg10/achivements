'use client'

import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { useActivityHeatmapYear } from '@/hooks/useActivityHeatmapYear'
import { useLanguage } from '@/context/LanguageContext'
import { ChartCard } from '@/components/ui/ChartCard'

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
import MainPageGroups from './MainPageGroups'

export default function MainPageCharts() {
  const { T } = useLanguage()
  const { achievements, isLoading: achLoading } = useRecentAchievements()
  const { achievements: heatmapData, isLoading: heatmapLoading } = useActivityHeatmap()
  const { listGames: playing, isLoading: playingLoading } = useGamesInProgressPreview()
  const { all, isLoading: gamesLoading } = useGamesData()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const { achievements: yearAch, isLoading: yearLoading } = useActivityHeatmapYear()

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label={T.cards.statsActivity}>
      <h2 className="text-xl font-semibold text-text-main">{T.cards.statsActivity}</h2>

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
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.dailyAchievements}</p>
            <div aria-hidden="true">
              <AchievementsLineChart achievements={achievements} isLoading={achLoading} />
            </div>
          </ChartCard>
          <ChartCard className="flex-1">
            <MainPageGroups />
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
