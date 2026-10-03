'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useGamesByCategory } from '../../../hooks/useGamesByCategory'
import { useGameExtraData } from '../../../hooks/useGameExtraData'
import { useConsoleFilter } from '../../../hooks/useConsoleFilter'
import { useGameFiltering } from '../../../hooks/useGameFiltering'
import StatusGameList from '../../../components/statusGameList/StatusGameList'
import StatusPageHeader from '../../../components/status-page-header/StatusPageHeader'
import CompletedFilter, {
  CompletedMode,
} from '../../../components/completed-filter/CompletedFilter'
import ConsoleFilter, { buildConsolePills } from '@/components/console-filter/ConsoleFilter'
import StatusSortControl, {
  StatusSortState,
  defaultSortStateFor,
} from '@/components/status-sort-control/StatusSortControl'
import StatusGridControl, { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import EmptyState from '../../../components/empty-state/EmptyState'
import StatusPageSkeleton from '@/components/status-page-skeleton/StatusPageSkeleton'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import SteamCategorySection from '@/components/steam/steam-category-section/SteamCategorySection'
import CollapsibleSection from '@/components/collapsible-section/CollapsibleSection'
import CollapsibleSectionPreview from '@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview'
import { raPreviewGames } from '@/utils/sectionPreview'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import RaLogo from '@/components/ra-logo/RaLogo'
import CategorySearch from '@/components/category-search/CategorySearch'
import { titleMatches } from '@/utils/gameCandidates'
import { useRaLinked } from '@/hooks/useRaLinked'
import { useMemo, useRef } from 'react'
import { usePreviewLayout } from '@/hooks/usePreviewLayout'

export default function CategoryPage() {
  const { category } = useParams()
  const { games, loading, error } = useGamesByCategory(category as string)
  const extraData = useGameExtraData()
  const { T } = useLanguage()
  const [completedMode, setCompletedMode] = useState<CompletedMode>('all')
  const { selected, toggle, clear } = useConsoleFilter()
  const cat = category as string
  const [sortState, setSortState] = useState<StatusSortState>(() => defaultSortStateFor(cat))
  const [gridCols, setGridCols] = useState<StatusGridCols>(2)
  const { isLinked: steamLinked } = useSteamGamesData()
  // A Steam-only user has no RA list to show — its empty state would tell them
  // to go play on RetroAchievements. Without either account, keep the RA page.
  // No RA account, no RA section — not even an empty one.
  const showRa = useRaLinked()

  // A different category starts from its own default order; adjusted during
  // render, so the old order is never shown for a frame.
  const [sortFor, setSortFor] = useState(cat)
  if (sortFor !== cat) {
    setSortFor(cat)
    setSortState(defaultSortStateFor(cat))
  }

  const EMPTY_STATE: Record<string, { icon: string; title: string; sub: string }> = {
    wantToPlay: { icon: '🔖', title: T.categoryPage.noWantToPlay, sub: T.categoryPage.noWantToPlaySub },
    playing: { icon: '🎮', title: T.categoryPage.noPlaying, sub: T.categoryPage.noPlayingSub },
    completed: { icon: '🏆', title: T.categoryPage.noCompleted, sub: T.categoryPage.noCompletedSub },
  }

  const consolePills = useMemo(() => buildConsolePills(games), [games])
  const filteredGames = useGameFiltering({ games, cat, extraData, selected, completedMode, sortState })
  const { games: allSteamGames } = useSteamGamesByCategory(cat)

  // One search box for both platforms: a game is found without knowing which it is on.
  const [query, setQuery] = useState('')
  const visibleGames = useMemo(() => filteredGames.filter((g) => titleMatches(g.Title, query)), [filteredGames, query])
  const steamGames = useMemo(() => allSteamGames.filter((g) => titleMatches(g.title, query)), [allSteamGames, query])

  // Folded previews fill the screen together: one entry per platform section
  // on the page, in order. PSN and Xbox, when they arrive, add theirs here.
  const pageRef = useRef<HTMLDivElement>(null)
  const sectionGames = [...(showRa && steamLinked ? [visibleGames.length] : []), ...(steamLinked ? [steamGames.length] : [])]
  const previews = usePreviewLayout(pageRef, sectionGames)
  const raPreview = { columns: previews.columns, count: previews.counts[0] ?? 3 }
  const steamPreview = { columns: previews.columns, count: previews.counts[showRa ? 1 : 0] ?? 3 }

  const selectedConsoleName =
    selected.size === 1 ? consolePills.find((c) => selected.has(c.id))?.name : undefined

  // RA-only controls: completion filter and sort apply to the RA list alone.
  const raControls = (
    <>
      {cat === 'completed' && <CompletedFilter value={completedMode} onChange={setCompletedMode} />}
      <StatusSortControl cat={cat} sortState={sortState} onChange={setSortState} />
    </>
  )

  const raBody = (
    <>
      {consolePills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-1">
          <ConsoleFilter pills={consolePills} selected={selected} onToggle={toggle} onClear={clear} />
        </div>
      )}
      {visibleGames.length === 0 ? (
        <EmptyState
          icon={EMPTY_STATE[cat]?.icon ?? '🎮'}
          title={EMPTY_STATE[cat]?.title ?? ''}
          subtitle={EMPTY_STATE[cat]?.sub ?? ''}
          className="min-h-[40vh]"
        />
      ) : (
        <StatusGameList games={visibleGames} extraData={extraData} category={cat} gridCols={gridCols} />
      )}
    </>
  )

  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div ref={pageRef} className="w-full lg:max-w-[98%] flex flex-col gap-3">
        {!showRa ? null : loading ? (
          <StatusPageSkeleton cols={gridCols} />
        ) : error ? (
          <p className="text-red-400 text-sm text-center mt-10">{error}</p>
        ) : !steamLinked ? (
          // RA only: the page as it always was.
          games.length === 0 ? (
            <EmptyState
              icon={EMPTY_STATE[cat]?.icon ?? '🎮'}
              title={EMPTY_STATE[cat]?.title ?? ''}
              subtitle={EMPTY_STATE[cat]?.sub ?? ''}
              className="min-h-[60vh]"
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <StatusPageHeader consoleName={selectedConsoleName} category={cat} gameCount={visibleGames.length} />
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <CategorySearch value={query} onChange={setQuery} />
                  {raControls}
                  <StatusGridControl cols={gridCols} onChange={setGridCols} />
                </div>
              </div>
              {raBody}
            </>
          )
        ) : (
          // RA and Steam: shared header (the grid control drives both lists),
          // then each platform in a section that folds away, so reaching Steam
          // does not mean scrolling past the whole RA list.
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StatusPageHeader
                consoleName={selectedConsoleName}
                category={cat}
                gameCount={visibleGames.length + steamGames.length}
              />
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <CategorySearch value={query} onChange={setQuery} />
                <StatusGridControl cols={gridCols} onChange={setGridCols} />
              </div>
            </div>
            <CollapsibleSection
              title="RetroAchievements"
              icon={<RaLogo height={20} />}
              count={visibleGames.length}
              storageKey={`ra-section-open:${cat}`}
              preview={<CollapsibleSectionPreview games={raPreviewGames(visibleGames)} columns={raPreview.columns} count={raPreview.count} />}
            >
              {games.length === 0 ? (
                <EmptyState
                  icon={EMPTY_STATE[cat]?.icon ?? '🎮'}
                  title={EMPTY_STATE[cat]?.title ?? ''}
                  subtitle={EMPTY_STATE[cat]?.sub ?? ''}
                  className="min-h-[20vh]"
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">{raControls}</div>
                  {raBody}
                </>
              )}
            </CollapsibleSection>
          </>
        )}
        {/* Steam alone: no RA header above, so the search box gets its own row. */}
        {!showRa && (
          <div className="flex justify-end">
            <CategorySearch value={query} onChange={setQuery} />
          </div>
        )}
        {(!showRa || !loading) && <SteamCategorySection category={cat} gridCols={gridCols} query={query} preview={steamPreview} />}
      </div>
    </div>
  )
}
