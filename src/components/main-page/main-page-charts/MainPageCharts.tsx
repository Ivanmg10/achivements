'use client'

import { useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconActivity, IconAward, IconCompass, IconFolders, IconLayoutDashboard, IconPin, IconUsers } from '@tabler/icons-react'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useSectionScroll } from '@/hooks/useSectionScroll'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'
import { useStreakData } from '@/hooks/useStreakData'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useGamesData } from '@/context/GamesDataContext'
import { useUserAwards } from '@/hooks/useUserAwards'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { useLanguage } from '@/context/LanguageContext'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { useSubject } from '@/context/SubjectContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { toRecentAchievement } from '@/utils/steamMappers'
import { psnToRecentAchievement } from '@/utils/psnMappers'
import { xboxToRecentAchievement } from '@/utils/xboxMappers'
import { ChartCard } from '@/components/ui/ChartCard'
import { SectionFallback } from '@/components/ui/SectionFallback'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useWhenIdle } from '@/hooks/useWhenIdle'

import AchievementsLineChart from '@/components/achivements-line-chart/AchievementsLineChart'
import MainPageHeatmap from './MainPageHeatmap'
import MainPageRarest from './MainPageRarest'
import MainPageAbandoned from './MainPageAbandoned'
import MainPageTopGames from './MainPageTopGames'
import MainPageMonthCompare from './main-page-month-compare/MainPageMonthCompare'
import MainPageHabits from './main-page-habits/MainPageHabits'
import MainPageJournal from './main-page-journal/MainPageJournal'
import MainPageBestPeriod from './MainPageBestPeriod'
import MainPagePeriodStats from '../main-page-period-stats/MainPagePeriodStats'
import MainPageStatsRail, { StatsSection } from '../main-page-stats-rail/MainPageStatsRail'
import MainPageBrowse from '../main-page-browse/MainPageBrowse'
import MainPagePinnedSection from '../main-page-pinned-section/MainPagePinnedSection'
import MainPageCollection from '../main-page-collection/MainPageCollection'
import MainPageGroupsSection from '../main-page-groups-section/MainPageGroupsSection'
import MainPageFriends from '../main-page-friends/MainPageFriends'
import Kicker from '@/components/ui/Kicker'

/** Sections that load their own data: mounted (hidden) once the browser is idle, unless opened first. */
const LOADS_ITS_OWN = new Set(['pinned', 'groups', 'browse'])

/**
 * Stats & Activity. Cards whose idea carries over between platforms —
 * activity, daily, most active, rarest, abandoned, mastered & completed,
 * groups and pinned — always show RA, Steam, PSN and Xbox together. The ones built
 * on RA-only concepts (points, consoles, awards) switch to a Steam or PSN
 * version with the selector at the top of the page, as does best performance.
 */
export default function MainPageCharts() {
  const { T } = useLanguage()
  // Someone else's page: their numbers, without the viewer's own pins, groups and library browser.
  const visitor = useSubject() !== null
  const [section, setSection] = useState('overview')
  const [activitySince] = useState(() => new Date(Date.now() - 60 * 86_400_000).toISOString())
  const idPrefix = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const { ref: sectionRef, scrollToTop } = useSectionScroll<HTMLElement>()
  // What is on screen first; the sections with loads of their own once there is a moment to spare (#101).
  const idle = useWhenIdle()

  // Opening a section brings the whole of it into view, its top just under the
  // sticky header, and holds it there while a section that loads once opened grows.
  const openSection = (id: string) => {
    setSection(id)
    scrollToTop()
  }
  const { achievements, isLoading: achLoading, error: achError, refetch: refetchAch } = useRecentAchievements()
  // The heatmap draws as far back as the card is wide, so it reads the year
  // the streak already loads — both platforms, and no call of its own.
  const { achievements: year, xboxAchievements: xboxYear, xboxLoading, psnTrophies: psnYear, psnLoading, activeStreak, isLoading: yearLoading, error: yearError, refetch: refetchYear } = useStreakData()
  // RA's and PlayStation's last 60 days are inside the year, refreshed as often (15 min on the server):
  // taken from it rather than asked again (#101). Steam keeps its own: its year is kept 30 min, its 60 days 5.
  const heatmapData = useMemo(
    () => year.filter((a) => (!a.Source || a.Source === 'ra') && a.Date.slice(0, 10) >= activitySince.slice(0, 10)),
    [year, activitySince],
  )
  const psnActivity = useMemo(() => psnYear.filter((t) => t.earnedAt >= activitySince), [psnYear, activitySince])
  // The top bar's streak is counted on the server from the same loaders and rules (useStreakSummary),
  // so once both are whole they agree.
  const streak = activeStreak?.days ?? 0
  const { listGames: playing, isLoading: playingLoading } = useGamesInProgressPreview()
  const { all, inProgress, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useGamesData()
  const { awards, isLoading: awardsLoading, error: awardsError, refetch: refetchAwards } = useUserAwards()
  const { platform } = useMainPlatform()
  const [layout] = useHomeLayout()
  const { isLinked: steamLinked, library } = useSteamGamesData()
  const { achievements: steamActivity, isLoading: steamLoading } = useSteamRecentAchievements(steamLinked ? 'activity' : null)
  const { library: psnLibrary } = usePsnGamesData()
  const { library: xboxLibrary } = useXboxGamesData()
  // The year is a superset of the 60-day window: reuse it instead of scanning the same games twice.
  const xboxActivity = useMemo(() => xboxYear.filter((a) => a.earnedAt >= activitySince), [xboxYear, activitySince])

  // Steam and PSN unlocks in RA's shape, so the shared cards render every platform as one list.
  const steamRecent = useMemo(() => steamActivity.map(toRecentAchievement), [steamActivity])
  // Without the games on the consoles unticked in preferences.
  const { isShown } = useConsoleVisibility()
  const psnRecent = useMemo(() => psnActivity.map(psnToRecentAchievement).filter(isShown), [psnActivity, isShown])
  const xboxRecent = useMemo(() => xboxActivity.map(xboxToRecentAchievement).filter(isShown), [xboxActivity, isShown])
  const byDateDesc = (a: { Date: string }, b: { Date: string }) => b.Date.localeCompare(a.Date)
  const recent = useMemo(
    () => [...achievements, ...steamRecent, ...psnRecent, ...xboxRecent].sort(byDateDesc),
    [achievements, steamRecent, psnRecent, xboxRecent],
  )

  // Best performance follows the selector: points (RA) and unlocks (Steam, PSN) do not add up.
  const bestPeriodData = platform === 'steam' ? steamRecent : platform === 'psn' ? psnRecent : platform === 'xbox' ? xboxRecent : heatmapData
  const bestPeriodLoading = platform === 'steam' ? steamLoading : platform === 'psn' ? psnLoading : platform === 'xbox' ? xboxLoading : yearLoading
  const bestPeriodError = platform === 'ra' && yearError

  const sections: StatsSection[] = [
    { id: 'overview', label: T.cards.sectionOverview, icon: <IconLayoutDashboard size={18} /> },
    { id: 'activity', label: T.cards.sectionActivity, icon: <IconActivity size={18} /> },
    { id: 'collection', label: T.cards.sectionCollection, icon: <IconAward size={18} /> },
    ...(visitor
      ? []
      : [
          { id: 'pinned', label: T.cards.sectionPinned, icon: <IconPin size={18} /> },
          { id: 'groups', label: T.cards.sectionGroups, icon: <IconFolders size={18} /> },
          { id: 'friends', label: T.cards.sectionFriends, icon: <IconUsers size={18} /> },
          { id: 'browse', label: T.cards.sectionBrowse, icon: <IconCompass size={18} /> },
        ]),
  ]

  const panels: Record<string, ReactNode> = {
    overview: (
      <>
        {/* Every platform together, whichever profile tab is open: per platform lives in the profile column (#128). */}
        <SectionFallback error={achError} onRefresh={refetchAch}>
          <MainPagePeriodStats
            achievements={recent}
            monthSource={year}
            // The cover has its own streak card beside it.
            streak={layout === 'cover' ? null : streak}
            isLoading={achLoading || steamLoading || psnLoading || xboxLoading || yearLoading}
          />
        </SectionFallback>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard className="xl:col-span-2">
            <SectionFallback error={yearError} onRefresh={refetchYear}>
              <MainPageHeatmap achievements={year} isLoading={yearLoading} />
            </SectionFallback>
          </ChartCard>
          <ChartCard>
            <Kicker>{T.cards.dailyAchievements}</Kicker>
            <SectionFallback error={achError} onRefresh={refetchAch}>
              <div aria-hidden="true">
                <AchievementsLineChart achievements={recent} isLoading={achLoading} />
              </div>
            </SectionFallback>
          </ChartCard>
        </div>
      </>
    ),
    // How the month is going and when the person plays, then four lists of the same
    // build side by side (two by two on a narrower screen). Rows stretch to their
    // tallest card, so cards of a row are paired by height and none leaves a hole.
    activity: (
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
        <ChartCard className="md:col-span-2 2xl:col-span-4">
          <SectionFallback error={yearError} onRefresh={refetchYear}>
            <MainPageMonthCompare achievements={year} isLoading={yearLoading} />
          </SectionFallback>
        </ChartCard>
        {/* Side by side from xl (half each, then 3/4 + 1/4 at 2xl): across the whole width, best performance stretched thin. */}
        <ChartCard className="md:col-span-2 xl:col-span-1 2xl:col-span-3">
          <SectionFallback error={yearError} onRefresh={refetchYear}>
            <MainPageHabits achievements={year} isLoading={yearLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard className="md:col-span-2 xl:col-span-1 2xl:col-span-1">
          <SectionFallback error={bestPeriodError} onRefresh={refetchYear}>
            <MainPageBestPeriod achievements={bestPeriodData} isLoading={bestPeriodLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard>
          <SectionFallback error={achError} onRefresh={refetchAch}>
            <MainPageTopGames achievements={recent} isLoading={achLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard>
          <SectionFallback error={yearError} onRefresh={refetchYear}>
            <MainPageJournal achievements={year} isLoading={yearLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard>
          <SectionFallback error={gamesError} onRefresh={refetchGames}>
            <MainPageAbandoned playing={playing} steamGames={library} psnGames={psnLibrary} xboxGames={xboxLibrary} isLoading={playingLoading} />
          </SectionFallback>
        </ChartCard>
        <ChartCard>
          <SectionFallback error={achError} onRefresh={refetchAch}>
            <MainPageRarest achievements={achievements} steamAchievements={steamActivity} psnTrophies={psnActivity} xboxAchievements={xboxActivity} isLoading={achLoading} />
          </SectionFallback>
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
        <MainPageCollection games={all} steamGames={library} psnGames={psnLibrary} xboxGames={xboxLibrary} awards={awards} inProgress={inProgress} isLoading={gamesLoading || awardsLoading} />
      </SectionFallback>
    ),
    // Goals, not activity: a section of their own, where they are seen (only on your own page).
    pinned: <MainPagePinnedSection />,
    groups: <MainPageGroupsSection />,
    // Loads only once opened: each friend costs a few platform calls.
    friends: <MainPageFriends active={section === 'friends'} myRecent={recent} />,
    browse: <MainPageBrowse />,
  }

  return (
    <section ref={sectionRef} className="p-4 flex flex-col gap-4 bg-bg-main scroll-mt-16" aria-labelledby={`${idPrefix}-title`} data-stats-section={section}>
      <h2 id={`${idPrefix}-title`} className="text-xl font-semibold text-text-main">{T.cards.statsActivity}</h2>

      {/*
        One section at a time instead of every card stacked: on a phone the
        old wall ran to some 6000px. Every hook above still loads up front, and
        the sections that load their own (pins, groups, browse) mount hidden as
        soon as the browser is idle, so switching sections never waits on the
        network while the first paint does not wait on them either (#101).

        Only the open section is laid out (the others stay mounted, hidden, so
        what they hold survives a switch): the area is as tall as that section,
        and the rail beside it runs exactly that height.
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(180px,220px)_1fr] gap-4 lg:items-start">
        <MainPageStatsRail
          sections={sections}
          active={section}
          onChange={openSection}
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
                {open || idle || !LOADS_ITS_OWN.has(id) ? panels[id] : null}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
