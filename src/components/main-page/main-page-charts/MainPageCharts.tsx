'use client'

import { useMemo } from 'react'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useActivityHeatmapYear } from '@/hooks/useActivityHeatmapYear'
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
import { SectionFallback } from '@/components/ui/SectionFallback'

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
  const { achievements, isLoading: achLoading, error: achError, refetch: refetchAch } = useRecentAchievements()
  const { achievements: heatmapData, isLoading: heatmapLoading, error: heatmapError, refetch: refetchHeatmap } = useActivityHeatmap()
  // The heatmap draws as far back as the card is wide, so it reads the year
  // the streak already loads — both platforms, and no call of its own.
  const { achievements: year, isLoading: yearLoading, error: yearError, refetch: refetchYear } = useActivityHeatmapYear()
  const { listGames: playing, isLoading: playingLoading } = useGamesInProgressPreview()
  const { all, hardcore, softcore, inProgress, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useGamesData()
  const { rank, isLoading: rankLoading, error: rankError, refetch: refetchRank } = useUserRank()
  const { awards, isLoading: awardsLoading, error: awardsError, refetch: refetchAwards } = useUserAwards()
  const { platform } = useMainPlatform()
  const { isLinked: steamLinked, library, libraryLoading } = useSteamGamesData()
  const isSteam = platform === 'steam'
  const { achievements: steamActivity, isLoading: steamLoading } = useSteamRecentAchievements(steamLinked ? 'activity' : null)

  // Steam unlocks in RA's shape, so the shared cards render both platforms as one list.
  const steamRecent = useMemo(() => steamActivity.map(toRecentAchievement), [steamActivity])
  const byDateDesc = (a: { Date: string }, b: { Date: string }) => b.Date.localeCompare(a.Date)
  const recent = useMemo(() => [...achievements, ...steamRecent].sort(byDateDesc), [achievements, steamRecent])

  // Best performance follows the selector: points (RA) and unlocks (Steam) do not add up.
  const bestPeriodData = isSteam ? steamRecent : heatmapData
  const bestPeriodLoading = isSteam ? steamLoading : heatmapLoading
  const bestPeriodError = !isSteam && heatmapError
  const refetchStats = () => {
    if (achError) refetchAch()
    if (rankError) refetchRank()
  }

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-label={T.cards.statsActivity}>
      <h2 className="text-xl font-semibold text-text-main">{T.cards.statsActivity}</h2>

      <div className="flex flex-col gap-4">
        {/* Stats pills */}
        {isSteam ? (
          <MainPageSteamStats achievements={steamRecent} games={library} isLoading={steamLoading} />
        ) : (
          <SectionFallback error={achError || rankError} onRefresh={refetchStats}>
            <MainPagePointsStats
              achievements={achievements}
              heatmapAchievements={heatmapData}
              rank={rank}
              isLoading={achLoading || rankLoading}
            />
          </SectionFallback>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Row 1: Heatmap | Daily | Groups placeholder */}
          <ChartCard>
            <SectionFallback error={yearError} onRefresh={refetchYear}>
              <MainPageHeatmap achievements={year} isLoading={yearLoading} />
            </SectionFallback>
          </ChartCard>
          <ChartCard>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.dailyAchievements}</p>
            <SectionFallback error={achError} onRefresh={refetchAch}>
              <div aria-hidden="true">
                <AchievementsLineChart achievements={recent} isLoading={achLoading} />
              </div>
            </SectionFallback>
          </ChartCard>
          <ChartCard className="flex-1">
            <MainPageGroups />
          </ChartCard>

          {/* Row 2: [Active | Rarest | Abandoned] | [col3: Perfect alone] */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <ChartCard>
              <SectionFallback error={achError} onRefresh={refetchAch}>
                <MainPageTopGames achievements={recent} isLoading={achLoading} />
              </SectionFallback>
            </ChartCard>
            <ChartCard>
              <SectionFallback error={achError} onRefresh={refetchAch}>
                <MainPageRarest achievements={achievements} steamAchievements={steamActivity} isLoading={achLoading} />
              </SectionFallback>
            </ChartCard>
            <ChartCard>
              <SectionFallback error={gamesError} onRefresh={refetchGames}>
                <MainPageAbandoned playing={playing} steamGames={library} isLoading={playingLoading} />
              </SectionFallback>
            </ChartCard>
          </div>
          <ChartCard>
            <SectionFallback error={gamesError} onRefresh={refetchGames}>
              <MainPagePerfectGames games={all} steamGames={library} isLoading={gamesLoading} />
            </SectionFallback>
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
              <SectionFallback error={awardsError} onRefresh={refetchAwards}>
                <MainPageMastery
                  awards={awards}
                  isLoading={awardsLoading}
                  unlockedHC={hardcore.reduce((sum, g) => sum + g.NumAwarded, 0)}
                  unlockedSC={softcore.reduce((sum, g) => sum + g.NumAwarded, 0)}
                  inProgress={inProgress}
                />
              </SectionFallback>
            )}
          </ChartCard>
          <ChartCard>
            <SectionFallback error={bestPeriodError} onRefresh={refetchHeatmap}>
              <MainPageBestPeriod achievements={bestPeriodData} isLoading={bestPeriodLoading} />
            </SectionFallback>
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
