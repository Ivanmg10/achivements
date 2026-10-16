'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useGamesByCategory } from '@/hooks/useGamesByCategory'
import { useGameExtraData } from '@/hooks/useGameExtraData'
import { useConsoleFilter } from '@/hooks/useConsoleFilter'
import { useGameFiltering } from '@/hooks/useGameFiltering'
import StatusGameList from '@/components/statusGameList/StatusGameList'
import StatusPageHeader from '@/components/status-page-header/StatusPageHeader'
import CompletedFilter, {
  CompletedMode,
} from '@/components/completed-filter/CompletedFilter'
import ConsoleFilter, { buildConsolePills } from '@/components/console-filter/ConsoleFilter'
import StatusSortControl from '@/components/status-sort-control/StatusSortControl'
import StatusGridControl from '@/components/status-grid-control/StatusGridControl'
import StatusEmptyState from '@/components/status-empty-state/StatusEmptyState'
import StatusPageSkeleton from '@/components/status-page-skeleton/StatusPageSkeleton'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import SteamCategorySection from '@/components/steam/steam-category-section/SteamCategorySection'
import PsnCategorySection from '@/components/psn/psn-category-section/PsnCategorySection'
import XboxCategorySection from '@/components/xbox/xbox-category-section/XboxCategorySection'
import CollapsibleSection from '@/components/collapsible-section/CollapsibleSection'
import CollapsibleSectionPreview from '@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview'
import { raPreviewGames } from '@/utils/sectionPreview'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import RaLogo from '@/components/ra-logo/RaLogo'
import CategorySearch from '@/components/category-search/CategorySearch'
import { titleMatches } from '@/utils/gameCandidates'
import { useRaLinked } from '@/hooks/useRaLinked'
import { useMemo, useRef } from 'react'
import { usePreviewLayout } from '@/hooks/usePreviewLayout'
import { useLibraryPrefs } from '@/hooks/useLibraryPrefs'
import { OpenCardProvider } from '@/context/OpenCardContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useLanguage } from '@/context/LanguageContext'
import LibraryQuickFilters from '@/components/library-quick-filters/LibraryQuickFilters'
import LibraryViewToggle from '@/components/library-view-toggle/LibraryViewToggle'
import LibraryAllList from '@/components/library-all-list/LibraryAllList'
import {
  buildEntries, countQuick, matchesQuick, MIXED_SORT_KEYS, psnProgress, raProgress, sortEntries, steamProgress, xboxProgress, type QuickFilter,
} from '@/utils/libraryInsights'
import LibraryExplorer from '@/components/library-explorer/LibraryExplorer'
import LibraryExplorerSkeleton from '@/components/library-explorer-skeleton/LibraryExplorerSkeleton'
import LibraryLayoutToggle, { type LibraryLayout } from '@/components/library-layout-toggle/LibraryLayoutToggle'
import LibraryPlatformTabs, { type PlatformChoice } from '@/components/library-platform-tabs/LibraryPlatformTabs'
import { countBySource } from '@/utils/libraryShelves'

export default function CategoryPage() {
  const { category } = useParams()
  const { games, loading, error } = useGamesByCategory(category as string)
  const extraData = useGameExtraData()
  const [completedMode, setCompletedMode] = useState<CompletedMode>('all')
  const { selected, toggle, clear } = useConsoleFilter()
  const cat = category as string
  const { T } = useLanguage()
  const { sortState, setSortState, allSortState, setAllSortState, gridCols, setGridCols, view, setView, layout: savedLayout, setLayout: saveLayout } = useLibraryPrefs(cat)
  // "Almost done" and "stalled" only make sense for games in progress; each category starts without one.
  const [quickChoice, setQuick] = useState<QuickFilter>('all')
  // The layout the user left is the one it opens on (remembered across visits); typing a search on the
  // shelves moves to the list only for as long as the search is there, without overwriting the choice.
  const [searchedToList, setSearchedToList] = useState(false)
  const layout: LibraryLayout = savedLayout === 'shelves' && searchedToList ? 'list' : savedLayout
  const setLayout = (next: LibraryLayout) => {
    setSearchedToList(false)
    saveLayout(next)
  }
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [platform, setPlatform] = useState<PlatformChoice>('all')
  useWhenChanged([cat], () => {
    setQuick('all')
    setSearchedToList(false)
    setSelectedKey(null)
    setPlatform('all')
  })
  const quick = cat === 'playing' ? quickChoice : 'all'
  const { isLinked: steamLinked } = useSteamGamesData()
  // A Steam-only user has no RA list to show — its empty state would tell them
  // to go play on RetroAchievements. Without either account, keep the RA page.
  // No RA account, no RA section — not even an empty one.
  const showRa = useRaLinked()



  const consolePills = useMemo(() => buildConsolePills(games), [games])
  const filteredGames = useGameFiltering({ games, cat, extraData, selected, completedMode, sortState })
  const { games: allSteamGames, loading: steamLoading, error: steamError } = useSteamGamesByCategory(cat)
  const { games: allPsnGames, isLinked: psnLinked, loading: psnLoading, error: psnError } = usePsnGamesByCategory(cat)
  const psnShown = psnLinked
  const { games: allXboxGames, isLinked: xboxShown, loading: xboxLoading, error: xboxError } = useXboxGamesByCategory(cat)
  // Another platform beside RA: each one gets a section that folds away.
  const othersLinked = steamLinked || psnShown || xboxShown

  // One search box for every platform: a game is found without knowing which it is on.
  const [query, setQuery] = useState('')
  const searchedGames = useMemo(() => filteredGames.filter((g) => titleMatches(g.Title, query)), [filteredGames, query])
  const searchedSteam = useMemo(() => allSteamGames.filter((g) => titleMatches(g.title, query)), [allSteamGames, query])
  const searchedPsn = useMemo(() => allPsnGames.filter((g) => titleMatches(g.title, query)), [allPsnGames, query])
  const searchedXbox = useMemo(() => allXboxGames.filter((g) => titleMatches(g.title, query)), [allXboxGames, query])

  // Platforms beside each other, or every game in one list: the choice only exists with 2+ platforms.
  const platformCount = (showRa ? 1 : 0) + (steamLinked ? 1 : 0) + (psnShown ? 1 : 0) + (xboxShown ? 1 : 0)
  const mixed = platformCount > 1 && view === 'all'
  const mixedLoading = (showRa && loading) || (steamLinked && steamLoading) || (psnShown && psnLoading) || (xboxShown && xboxLoading)
  // Shelves and the list read every platform together; only the cards view keeps them apart.
  const explorer = layout !== 'cards' && platformCount > 0
  const explorerEntries = useMemo(
    () => buildEntries(showRa ? games : [], extraData, steamLinked ? allSteamGames : [], psnShown ? allPsnGames : [], xboxShown ? allXboxGames : []),
    [showRa, games, extraData, steamLinked, allSteamGames, psnShown, allPsnGames, xboxShown, allXboxGames],
  )
  // One platform, or all: a chosen platform that has run out of games (hidden, say) is all again.
  const perPlatform = useMemo(() => countBySource(explorerEntries), [explorerEntries])
  const activePlatform = platform !== 'all' && perPlatform[platform] === 0 ? 'all' : platform
  const platformEntries = useMemo(
    () => (activePlatform === 'all' ? explorerEntries : explorerEntries.filter((e) => e.kind === activePlatform)),
    [explorerEntries, activePlatform],
  )
  // Typing while on the shelves goes to the list, where the matches are.
  function changeQuery(next: string) {
    setQuery(next)
    if (layout === 'shelves' && next.trim()) setSearchedToList(true)
  }
  const mixedEntries = useMemo(
    () =>
      buildEntries(
        mixed && showRa ? games.filter((g) => titleMatches(g.Title, query)) : [],
        extraData,
        mixed && steamLinked ? searchedSteam : [],
        mixed && psnShown ? searchedPsn : [],
        mixed && xboxShown ? searchedXbox : [],
      ),
    [mixed, showRa, games, query, extraData, steamLinked, psnShown, xboxShown, searchedSteam, searchedPsn, searchedXbox],
  )

  // Counts for the quick filters come from what the page lists before they apply.
  const quickCounts = useMemo(
    () =>
      countQuick(
        mixed
          ? mixedEntries
          : [
              ...searchedGames.map((g) => raProgress(g, extraData.get('GameID' in g && g.GameID ? g.GameID : (g as { ID: number }).ID))),
              ...searchedSteam.map(steamProgress),
              ...searchedPsn.map(psnProgress),
              ...searchedXbox.map(xboxProgress),
            ],
      ),
    [mixed, mixedEntries, searchedGames, searchedSteam, searchedPsn, searchedXbox, extraData],
  )
  const visibleGames = useMemo(
    () => searchedGames.filter((g) => matchesQuick(raProgress(g, extraData.get('GameID' in g && g.GameID ? g.GameID : (g as { ID: number }).ID)), quick)),
    [searchedGames, extraData, quick],
  )
  const steamGames = useMemo(() => searchedSteam.filter((g) => matchesQuick(steamProgress(g), quick)), [searchedSteam, quick])
  const psnGames = useMemo(() => searchedPsn.filter((g) => matchesQuick(psnProgress(g), quick)), [searchedPsn, quick])
  const xboxGames = useMemo(() => searchedXbox.filter((g) => matchesQuick(xboxProgress(g), quick)), [searchedXbox, quick])
  const mixedList = useMemo(
    () => sortEntries(mixedEntries.filter((e) => matchesQuick(e, quick)), allSortState),
    [mixedEntries, quick, allSortState],
  )

  // Folded previews fill the screen together: one entry per platform section
  // on the page, in order (RA, Steam, PSN, Xbox).
  const pageRef = useRef<HTMLDivElement>(null)
  const sections = [
    ...(showRa && othersLinked ? [{ id: 'ra', games: visibleGames.length }] : []),
    ...(steamLinked ? [{ id: 'steam', games: steamGames.length }] : []),
    ...(psnShown ? [{ id: 'psn', games: psnGames.length }] : []),
    ...(xboxShown ? [{ id: 'xbox', games: xboxGames.length }] : []),
  ]
  const previews = usePreviewLayout(pageRef, sections.map((s) => s.games))
  const previewFor = (id: string) => {
    const i = sections.findIndex((s) => s.id === id)
    return { columns: previews.columns, count: previews.counts[i] ?? 3 }
  }
  const raPreview = previewFor('ra')
  const steamPreview = previewFor('steam')
  const psnPreview = previewFor('psn')
  const xboxPreview = previewFor('xbox')

  const selectedConsoleName =
    selected.size === 1 ? consolePills.find((c) => selected.has(c.id))?.name : undefined

  // RA-only controls: completion filter and sort apply to the RA list alone.
  const raControls = (
    <>
      {cat === 'completed' && <CompletedFilter value={completedMode} onChange={setCompletedMode} />}
      <StatusSortControl cat={cat} sortState={sortState} onChange={setSortState} />
    </>
  )

  const layoutToggle = platformCount > 0 && <LibraryLayoutToggle value={layout} onChange={setLayout} />
  const quickRow = cat === 'playing' && <LibraryQuickFilters value={quick} counts={quickCounts} onChange={setQuick} />
  const viewToggle = platformCount > 1 && <LibraryViewToggle value={view} onChange={setView} />

  const raBody = (
    <>
      {consolePills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-1">
          <ConsoleFilter pills={consolePills} selected={selected} onToggle={toggle} onClear={clear} />
        </div>
      )}
      {visibleGames.length === 0 ? (
        <StatusEmptyState category={cat} className="min-h-[40vh]" />
      ) : (
        <StatusGameList games={visibleGames} extraData={extraData} category={cat} gridCols={gridCols} />
      )}
    </>
  )

  return (
    <OpenCardProvider>
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div ref={pageRef} className="w-full lg:max-w-[98%] flex flex-col gap-3">
        {explorer ? (
          mixedLoading ? (
            <LibraryExplorerSkeleton layout={layout === 'list' ? 'list' : 'shelves'} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <StatusPageHeader category={cat} gameCount={platformEntries.length}>
                  <LibraryPlatformTabs value={activePlatform} counts={perPlatform} onChange={setPlatform} />
                </StatusPageHeader>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <CategorySearch value={query} onChange={changeQuery} shortcut />
                  {layoutToggle}
                </div>
              </div>
              {(error || steamError || psnError || xboxError) && (
                <p role="alert" className="text-sm text-red-400">
                  {[error, steamError && (steamError === 'private' ? T.steamLink.errors.private : T.steam.gamesError), psnError && T.psn.gamesError, xboxError && T.xbox.gamesError].filter(Boolean).join(' · ')}
                </p>
              )}
              {explorerEntries.length === 0 ? (
                <StatusEmptyState category={cat} className="min-h-[40vh]" />
              ) : (
                <LibraryExplorer
                  key={cat}
                  category={cat}
                  entries={platformEntries}
                  platform={activePlatform}
                  layout={layout === 'list' ? 'list' : 'shelves'}
                  onLayout={setLayout}
                  query={query}
                  onQuery={setQuery}
                  quick={quick}
                  onQuick={setQuick}
                  sort={allSortState}
                  onSort={setAllSortState}
                  selectedKey={selectedKey}
                  onSelectKey={setSelectedKey}
                />
              )}
            </>
          )
        ) : mixed ? (
          mixedLoading ? (
            <StatusPageSkeleton cols={gridCols} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <StatusPageHeader category={cat} gameCount={mixedList.length} />
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <CategorySearch value={query} onChange={setQuery} />
                  <StatusSortControl cat={cat} keys={[...MIXED_SORT_KEYS]} sortState={allSortState} onChange={setAllSortState} />
                  <StatusGridControl cols={gridCols} onChange={setGridCols} />
                  {viewToggle}{layoutToggle}
                </div>
              </div>
              {quickRow}
              {(error || steamError || psnError || xboxError) && (
                <p role="alert" className="text-sm text-red-400">
                  {[error, steamError && (steamError === 'private' ? T.steamLink.errors.private : T.steam.gamesError), psnError && T.psn.gamesError, xboxError && T.xbox.gamesError].filter(Boolean).join(' · ')}
                </p>
              )}
              <LibraryAllList entries={mixedList} category={cat} gridCols={gridCols} />
            </>
          )
        ) : !showRa ? null : loading ? (
          <StatusPageSkeleton cols={gridCols} />
        ) : error ? (
          <p className="text-red-400 text-sm text-center mt-10">{error}</p>
        ) : !othersLinked ? (
          // RA only: the page as it always was.
          games.length === 0 ? (
            <StatusEmptyState category={cat} className="min-h-[60vh]" />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <StatusPageHeader consoleName={selectedConsoleName} category={cat} gameCount={visibleGames.length} />
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <CategorySearch value={query} onChange={setQuery} />
                  {raControls}
                  <StatusGridControl cols={gridCols} onChange={setGridCols} />
                  {layoutToggle}
                </div>
              </div>
              {quickRow}
              {raBody}
            </>
          )
        ) : (
          // RA and others: shared header (the grid control drives every list),
          // then each platform in a section that folds away, so reaching Steam
          // or PSN does not mean scrolling past the whole RA list.
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StatusPageHeader
                consoleName={selectedConsoleName}
                category={cat}
                gameCount={visibleGames.length + steamGames.length + (psnShown ? psnGames.length : 0) + (xboxShown ? xboxGames.length : 0)}
              />
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <CategorySearch value={query} onChange={setQuery} />
                <StatusGridControl cols={gridCols} onChange={setGridCols} />
                {viewToggle}{layoutToggle}
              </div>
            </div>
            {quickRow}
            <CollapsibleSection
              title="RetroAchievements"
              icon={<RaLogo height={20} />}
              count={visibleGames.length}
              storageKey={`ra-section-open:${cat}`}
              preview={<CollapsibleSectionPreview games={raPreviewGames(visibleGames)} columns={raPreview.columns} count={raPreview.count} />}
            >
              {games.length === 0 ? (
                <StatusEmptyState category={cat} className="min-h-[20vh]" />
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
        {!showRa && !mixed && !explorer && (
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <CategorySearch value={query} onChange={setQuery} />
            {viewToggle}{layoutToggle}
          </div>
        )}
        {!showRa && !mixed && !explorer && quickRow}
        {!mixed && !explorer && (!showRa || !loading) && <SteamCategorySection category={cat} gridCols={gridCols} query={query} quick={quick} preview={steamPreview} />}
        {!mixed && !explorer && (!showRa || !loading) && <PsnCategorySection category={cat} gridCols={gridCols} query={query} quick={quick} preview={psnPreview} />}
        {!mixed && !explorer && (!showRa || !loading) && <XboxCategorySection category={cat} gridCols={gridCols} query={query} quick={quick} preview={xboxPreview} />}
      </div>
    </div>
    </OpenCardProvider>
  )
}
