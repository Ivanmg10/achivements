'use client'

import { useMemo } from 'react'
import { useAllGamesGlobal } from '@/hooks/useAllGamesGlobal'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { xboxHasAchievements } from '@/utils/xboxTitles'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { buildLibrary, summarizeConsoles } from '@/utils/library'
import { ChartCard } from '@/components/ui/ChartCard'
import MainPageConsoleNav from '@/components/main-page/main-page-charts/MainPageConsoleNav'
import MainPageSteamNav from '@/components/main-page/main-page-charts/main-page-steam-nav/MainPageSteamNav'
import MainPagePsnNav from '@/components/main-page/main-page-charts/main-page-psn-nav/MainPagePsnNav'
import MainPageXboxNav from '@/components/main-page/main-page-charts/main-page-xbox-nav/MainPageXboxNav'
import BrowseSearch from './browse-search/BrowseSearch'
import BrowseConsoles from './browse-consoles/BrowseConsoles'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * The Browse section: the way into each list (by status, and by console on
 * RA), a search across every library, and a tile per console, each across the
 * full width. The search covers every platform whatever the selector says; the
 * nav and the consoles follow it.
 */
export default function MainPageBrowse() {
  const { wantToPlay, playing, completed } = useAllGamesGlobal()
  const { all, isLoading } = useGamesData()
  const { library: steam } = useSteamGamesData()
  const { library: psn } = usePsnGamesData()
  const { library: xbox } = useXboxGamesData()
  const { platform } = useMainPlatform()

  const library = useMemo(
    () => buildLibrary({ playing, completed, wantToPlay }, steam, psn, xbox.filter(xboxHasAchievements)),
    [playing, completed, wantToPlay, steam, psn, xbox],
  )
  const consoles = useMemo(() => summarizeConsoles(all), [all])
  const showConsoles = platform === 'ra' && consoles.length > 0

  return (
    <div className="flex flex-col gap-4">
      <ChartCard>
        {platform === 'steam' ? <MainPageSteamNav /> : platform === 'psn' ? <MainPagePsnNav /> : platform === 'xbox' ? <MainPageXboxNav /> : <MainPageConsoleNav />}
      </ChartCard>

      <ChartCard>
        <BrowseSearch library={library} />
      </ChartCard>

      {platform === 'ra' && isLoading && all.length === 0 && (
        <ChartCard>
          <div aria-busy="true" className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} radius="tile" className="h-[4.5rem]" />
              ))}
            </div>
          </div>
        </ChartCard>
      )}

      {showConsoles && (
        <ChartCard>
          <BrowseConsoles consoles={consoles} />
        </ChartCard>
      )}
    </div>
  )
}
