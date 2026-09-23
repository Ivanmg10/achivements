'use client'

import { useMemo } from 'react'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useGamesData } from '@/context/GamesDataContext'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { useLanguage } from '@/context/LanguageContext'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { toRecentAchievement } from '@/utils/steamMappers'
import { ChartCard } from '@/components/ui/ChartCard'

import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import MainPageHeatmap from './MainPageHeatmap'
import MainPagePointsStats from './MainPagePointsStats'
import MainPageRarest from './MainPageRarest'
import MainPageAbandoned from './MainPageAbandoned'
import MainPageTopGames from './MainPageTopGames'
import MainPageMastery from './MainPageMastery'
import MainPagePerfectGames from './MainPagePerfectGames'
import MainPageBestPeriod from './MainPageBestPeriod'
import MainPageFavorites from '../main-page-favorites/MainPageFavorites'
import MainPageConsoleNav from './MainPageConsoleNav'
import MainPageGroups from './MainPageGroups'
import MainPageSteamStats from './main-page-steam-stats/MainPageSteamStats'
import MainPageSteamNav from './main-page-steam-nav/MainPageSteamNav'
import MainPageSteamMastery from './main-page-steam-mastery/MainPageSteamMastery'

/**
 * Stats & Activity. Cards whose idea carries over between platforms —
 * activity, daily, most active, rarest, abandoned, mastered & completed,
 * groups and pinned — always show RA and Steam together. The ones built on
 * RA-only concepts (points, consoles, awards) switch to a Steam version with
 * the selector at the top of the page, as does best performance.
 */
export default function MainPageCharts() {
  const { T } = useLanguage()
  const { achievements, isLoading: achLoading } = useRecentAchievements()
  const { achievements: heatmapData, isLoading: heatmapLoading } = useActivityHeatmap()
  const { listGames: playing, isLoading: playingLoading } = useGamesInProgressPreview()
  const { all, hardcore, softcore, isLoading: gamesLoading } = useGamesData()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const { platform } = useMainPlatform()
  const { isLinked: steamLinked, library, libraryLoading } = useSteamGamesData()
  const isSteam = platform === 'steam'
  const { achievements: steamActivity, isLoading: steamLoading } = useSteamRecentAchievements(steamLinked ? 'activity' : null)

  // Steam unlocks in RA's shape, so the shared cards render both platforms as one list.
  const steamRecent = useMemo(() => steamActivity.map(toRecentAchievement), [steamActivity])
  const byDateDesc = (a: { Date: string }, b: { Date: string }) => b.Date.localeCompare(a.Date)
  const recent = useMemo(() => [...achievements, ...steamRecent].sort(byDateDesc), [achievements, steamRecent])
  const heatmap = useMemo(() => [...heatmapData, ...steamRecent].sort(byDateDesc), [heatmapData, steamRecent])

  // Best performance follows the selector: points (RA) and unlocks (Steam) do not add up.
  const bestPeriodData = isSteam ? steamRecent : heatmapData
  const bestPeriodLoading = isSteam ? steamLoading : heatmapLoading

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label={T.cards.statsActivity}>
      <h2 className="text-xl font-semibold text-text-main">{T.cards.statsActivity}</h2>

      <div className="flex flex-col gap-4">
        {/* Stats pills */}
        {isSteam ? (
          <MainPageSteamStats achievements={steamRecent} games={library} isLoading={steamLoading} />
        ) : (
          <MainPagePointsStats
            achievements={achievements}
            heatmapAchievements={heatmapData}
            rank={rank}
            isLoading={achLoading || rankLoading}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Row 1: Heatmap | Daily | Groups placeholder */}
          <ChartCard>
            <MainPageHeatmap achievements={heatmap} isLoading={heatmapLoading} />
          </ChartCard>
          <ChartCard>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.dailyAchievements}</p>
            <div aria-hidden="true">
              <AchievementsLineChart achievements={recent} isLoading={achLoading} />
            </div>
          </ChartCard>
          <ChartCard className="flex-1">
            <MainPageGroups />
          </ChartCard>

          {/* Row 2: [Active | Rarest | Abandoned] | [col3: Perfect alone] */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <ChartCard>
              <MainPageTopGames achievements={recent} isLoading={achLoading} />
            </ChartCard>
            <ChartCard>
              <MainPageRarest achievements={achievements} steamAchievements={steamActivity} isLoading={achLoading} />
            </ChartCard>
            <ChartCard>
              <MainPageAbandoned playing={playing} steamGames={library} isLoading={playingLoading} />
            </ChartCard>
          </div>
          <ChartCard>
            <MainPagePerfectGames games={all} steamGames={library} isLoading={gamesLoading} />
          </ChartCard>

        </div>

        {/*
          Last band on its own grid, aligned to the top: how much these hold
          swings with the account (no masteries yet, dozens of pins), so a card
          ends where its content ends instead of stretching to the tallest one.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Navigation across the full width — it is a row of sections, not a card */}
          <ChartCard className="lg:col-span-3">
            {isSteam ? <MainPageSteamNav /> : <MainPageConsoleNav />}
          </ChartCard>

          <ChartCard className="lg:col-span-2">
            {isSteam ? (
              <MainPageSteamMastery games={library} isLoading={libraryLoading} />
            ) : (
              <MainPageMastery
                awards={awards}
                isLoading={awardsLoading}
                unlockedHC={hardcore.reduce((sum, g) => sum + g.NumAwarded, 0)}
                unlockedSC={softcore.reduce((sum, g) => sum + g.NumAwarded, 0)}
              />
            )}
          </ChartCard>
          <ChartCard>
            <MainPageBestPeriod achievements={bestPeriodData} isLoading={bestPeriodLoading} />
          </ChartCard>

          {/* Pinned closes the page across the full width: the list can run long. */}
          <ChartCard className="lg:col-span-3">
            <MainPageFavorites />
          </ChartCard>
        </div>
      </div>
    </section>
  )
}
