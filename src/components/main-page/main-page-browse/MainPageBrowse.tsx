'use client'

import { useMemo } from 'react'
import { useAllGamesGlobal } from '@/hooks/useAllGamesGlobal'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { buildLibrary, summarizeConsoles } from '@/utils/library'
import { summarizeSteamLibrary } from '@/utils/steamFeed'
import { classifyPsnGame } from '@/utils/psnTitles'
import { ChartCard } from '@/components/ui/ChartCard'
import MainPageConsoleNav from '@/components/main-page/main-page-charts/MainPageConsoleNav'
import MainPageSteamNav from '@/components/main-page/main-page-charts/main-page-steam-nav/MainPageSteamNav'
import MainPagePsnNav from '@/components/main-page/main-page-charts/main-page-psn-nav/MainPagePsnNav'
import BrowsePicker from './browse-picker/BrowsePicker'
import BrowseSearch from './browse-search/BrowseSearch'
import BrowseSplit from './browse-split/BrowseSplit'
import BrowseConsoles from './browse-consoles/BrowseConsoles'

/**
 * The Browse section: the way into each list (by status, and by console on
 * RA), then a picker for what to play next, a search across both libraries,
 * the platforms side by side, and a tile per console. The picker, search
 * and comparison cover every platform whatever the selector says, since they
 * are about the whole collection; the nav and the consoles follow it.
 */
export default function MainPageBrowse() {
  const { wantToPlay, playing, completed } = useAllGamesGlobal()
  const { all } = useGamesData()
  const { library: steam } = useSteamGamesData()
  const { isLinked: psnLinked, library: psn } = usePsnGamesData()
  const { platform } = useMainPlatform()

  const library = useMemo(
    () => buildLibrary({ playing, completed, wantToPlay }, steam, psn),
    [playing, completed, wantToPlay, steam, psn],
  )
  const pool = useMemo(() => library.filter((g) => g.status === 'playing' || g.status === 'wantToPlay'), [library])
  const consoles = useMemo(() => summarizeConsoles(all), [all])
  const totals = useMemo(() => {
    const s = summarizeSteamLibrary(steam)
    // From the same list as the RA platform card (every started game, once), so the numbers agree.
    const bestByGame = new Map<number, { pct: number; unlocked: number }>()
    for (const g of all) {
      const prev = bestByGame.get(g.GameID)
      bestByGame.set(g.GameID, {
        pct: Math.max(prev?.pct ?? 0, parseFloat(g.PctWon)),
        unlocked: Math.max(prev?.unlocked ?? 0, g.NumAwarded),
      })
    }
    const best = [...bestByGame.values()]
    return {
      ra: {
        started: best.length,
        unlocked: best.reduce((sum, g) => sum + g.unlocked, 0),
        perfect: best.filter((g) => g.pct >= 1).length,
      },
      steam: { started: s.playing + s.perfect, unlocked: s.unlocked, perfect: s.perfect },
      psn: {
        started: psn.filter((g) => g.numAwarded > 0).length,
        unlocked: psn.reduce((sum, g) => sum + g.numAwarded, 0),
        perfect: psn.filter((g) => classifyPsnGame(g) === 'completed').length,
      },
    }
  }, [all, steam, psn])

  const showConsoles = platform === 'ra' && consoles.length > 0

  return (
    <div className="flex flex-col gap-4">
      <ChartCard>
        {platform === 'steam' ? <MainPageSteamNav /> : platform === 'psn' ? <MainPagePsnNav /> : <MainPageConsoleNav />}
      </ChartCard>

      {/* The picker on the left, as tall as the search and the comparison stacked beside it. */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard className="xl:row-span-2">
          <BrowsePicker pool={pool} />
        </ChartCard>
        <ChartCard className="xl:col-span-2">
          <BrowseSearch library={library} />
        </ChartCard>
        <ChartCard className="xl:col-span-2">
          <BrowseSplit ra={totals.ra} steam={totals.steam} psn={psnLinked ? totals.psn : undefined} />
        </ChartCard>
      </div>

      {showConsoles && (
        <ChartCard>
          <BrowseConsoles consoles={consoles} />
        </ChartCard>
      )}
    </div>
  )
}
