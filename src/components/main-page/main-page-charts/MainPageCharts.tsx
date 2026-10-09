'use client'

import { useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconActivity, IconAward, IconCompass, IconFolders, IconLayoutDashboard } from '@tabler/icons-react'
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
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { toRecentAchievement } from '@/utils/steamMappers'
import { psnToRecentAchievement } from '@/utils/psnMappers'
import { ChartCard } from '@/components/ui/ChartCard'
import { SectionFallback } from '@/components/ui/SectionFallback'

import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import MainPageHeatmap from './MainPageHeatmap'
import MainPagePointsStats from './MainPagePointsStats'
import MainPageRarest from './MainPageRarest'
import MainPageAbandoned from './MainPageAbandoned'
import MainPageTopGames from './MainPageTopGames'
import MainPageBestPeriod from './MainPageBestPeriod'
import MainPageFavorites from '../main-page-favorites/MainPageFavorites'
import MainPageSteamStats from './main-page-steam-stats/MainPageSteamStats'
import MainPagePsnStats from './main-page-psn-stats/MainPagePsnStats'
import MainPageStatsRail, { StatsSection } from '../main-page-stats-rail/MainPageStatsRail'
import MainPageBrowse from '../main-page-browse/MainPageBrowse'
import MainPageCollection from '../main-page-collection/MainPageCollection'
import MainPageGroupsSection from '../main-page-groups-section/MainPageGroupsSection'

/**
 * Stats & Activity. Cards whose idea carries over between platforms —
 * activity, daily, most active, rarest, abandoned, mastered & completed,
 * groups and pinned — always show RA, Steam and PSN together. The ones built
 * on RA-only concepts (points, consoles, awards) switch to a Steam or PSN
 * version with the selector at the top of the page, as does best performance.
 */
export default function MainPageCharts() {
  const { T } = useLanguage()
  const [section, setSection] = useState('overview')
  const idPrefix = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const { achievements, isLoading: achLoading, error: achError, refetch: refetchAch } = useRecentAchievements()
  const { achievements: heatmapData, isLoading: heatmapLoading, error: heatmapError, refetch: refetchHeatmap } = useActivityHeatmap()
  // The heatmap draws as far back as the card is wide, so it reads the year
  // the streak already loads — both platforms, and no call of its own.
  const { achievements: year, isLoading: yearLoading, error: yearError, refetch: refetchYear } = useActivityHeatmapYear()
  const { listGames: playing, isLoading: playingLoading } = useGamesInProgressPreview()
  const { all, inProgress, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useGamesData()
  const { rank, isLoading: rankLoading, error: rankError, refetch: refetchRank } = useUserRank()
  const { awards, isLoading: awardsLoading, error: awardsError, refetch: refetchAwards } = useUserAwards()
  const { platform } = useMainPlatform()
  const { isLinked: steamLinked, library } = useSteamGamesData()
  const { achievements: steamActivity, isLoading: steamLoading } = useSteamRecentAchievements(steamLinked ? 'activity' : null)
  const { library: psnLibrary } = usePsnGamesData()
  const { trophies: psnActivity, isLoading: psnLoading } = usePsnRecentTrophies('activity')

  // Steam and PSN unlocks in RA's shape, so the shared cards render every platform as one list.
  const steamRecent = useMemo(() => steamActivity.map(toRecentAchievement), [steamActivity])
  const psnRecent = useMemo(() => psnActivity.map(psnToRecentAchievement), [psnActivity])
  const byDateDesc = (a: { Date: string }, b: { Date: string }) => b.Date.localeCompare(a.Date)
  const recent = useMemo(
    () => [...achievements, ...steamRecent, ...psnRecent].sort(byDateDesc),
    [achievements, steamRecent, psnRecent],
  )

  // Best performance follows the selector: points (RA) and unlocks (Steam, PSN) do not add up.
  const bestPeriodData = platform === 'steam' ? steamRecent : platform === 'psn' ? psnRecent : heatmapData
  const bestPeriodLoading = platform === 'steam' ? steamLoading : platform === 'psn' ? psnLoading : heatmapLoading
  const bestPeriodError = platform === 'ra' && heatmapError
  const refetchStats = () => {
    if (achError) refetchAch()
    if (rankError) refetchRank()
  }

  const sections: StatsSection[] = [
    { id: 'overview', label: T.cards.sectionOverview, icon: <IconLayoutDashboard size={18} /> },
    { id: 'activity', label: T.cards.sectionActivity, icon: <IconActivity size={18} /> },
    { id: 'collection', label: T.cards.sectionCollection, icon: <IconAward size={18} /> },
    { id: 'groups', label: T.cards.sectionGroups, icon: <IconFolders size={18} /> },
    { id: 'browse', label: T.cards.sectionBrowse, icon: <IconCompass size={18} /> },
  ]

  const panels: Record<string, ReactNode> = {
    overview: (
      <>
        {platform === 'steam' ? (
          <MainPageSteamStats achievements={steamRecent} games={library} isLoading={steamLoading} />
        ) : platform === 'psn' ? (
          <MainPagePsnStats achievements={psnRecent} isLoading={psnLoading} />
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard className="xl:col-span-2">
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
        </div>
      </>
    ),
    // What was played and unlocked lately: the games, then the achievements.
    activity: (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <ChartCard>
          <SectionFallback error={achError} onRefresh={refetchAch}>
            <MainPageTopGames achievements={recent} isLoading={achLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard>
          <SectionFallback error={gamesError} onRefresh={refetchGames}>
            <MainPageAbandoned playing={playing} steamGames={library} psnGames={psnLibrary} isLoading={playingLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard className="md:col-span-2 xl:col-span-1">
          <SectionFallback error={bestPeriodError} onRefresh={refetchHeatmap}>
            <MainPageBestPeriod achievements={bestPeriodData} isLoading={bestPeriodLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard className="md:col-span-2 xl:col-span-1">
          <SectionFallback error={achError} onRefresh={refetchAch}>
            <MainPageRarest achievements={achievements} steamAchievements={steamActivity} psnTrophies={psnActivity} isLoading={achLoading} />
          </SectionFallback>
        </ChartCard>
        {/* Pinned achievements beside it, across the rest: the list can run long. */}
        <ChartCard className="md:col-span-2">
          <MainPageFavorites />
        </ChartCard>
      </div>
    ),
    collection: (
      <SectionFallback
        error={gamesError || awardsError}
        onRefresh={() => {
          if (gamesError) refetchGames()
          if (awardsError) refetchAwards()
        }}
      >
        <MainPageCollection games={all} steamGames={library} psnGames={psnLibrary} awards={awards} inProgress={inProgress} isLoading={gamesLoading || awardsLoading} />
      </SectionFallback>
    ),
    groups: <MainPageGroupsSection />,
    browse: <MainPageBrowse />,
  }

  return (
    <section className="p-4 flex flex-col gap-4 bg-bg-main" aria-labelledby={`${idPrefix}-title`} data-stats-section={section}>
      <h2 id={`${idPrefix}-title`} className="text-xl font-semibold text-text-main">{T.cards.statsActivity}</h2>

      {/*
        One section at a time instead of every card stacked: on a phone the
        old wall ran to some 6000px. Every hook above still loads up front,
        so switching sections never waits on the network.

        Only the open section is laid out (the others stay mounted, hidden, so
        what they hold survives a switch): the area is as tall as that section,
        and the rail beside it runs exactly that height.
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(180px,220px)_1fr] gap-4 lg:items-start">
        <MainPageStatsRail
          sections={sections}
          active={section}
          onChange={setSection}
          label={T.cards.sectionsLabel}
          idPrefix={idPrefix}
        />

        <div className="grid w-full min-w-0">
          {sections.map(({ id }) => {
            const open = id === section
            return (
              <motion.div
                key={id}
                role="tabpanel"
                id={`${idPrefix}-panel-${id}`}
                aria-labelledby={`${idPrefix}-tab-${id}`}
                aria-hidden={!open}
                inert={!open}
                className={`min-w-0 flex-col gap-4 ${open ? 'flex' : 'hidden'}`}
                initial={false}
                animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: reduceMotion ? 0 : 6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {panels[id]}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
