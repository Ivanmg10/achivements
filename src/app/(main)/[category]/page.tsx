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
import LoadingPage from '../../../components/loading-page/LoadingPage'
import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import { useEffect, useMemo } from 'react'

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

  useEffect(() => {
    setSortState(defaultSortStateFor(cat))
  }, [cat])

  const EMPTY_STATE: Record<string, { icon: string; title: string; sub: string }> = {
    wantToPlay: { icon: '🔖', title: T.categoryPage.noWantToPlay, sub: T.categoryPage.noWantToPlaySub },
    playing: { icon: '🎮', title: T.categoryPage.noPlaying, sub: T.categoryPage.noPlayingSub },
    completed: { icon: '🏆', title: T.categoryPage.noCompleted, sub: T.categoryPage.noCompletedSub },
  }

  const consolePills = useMemo(() => buildConsolePills(games), [games])
  const visibleGames = useGameFiltering({ games, cat, extraData, selected, completedMode, sortState })

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-white"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full lg:max-w-[98%] flex flex-col gap-3">
        {loading ? (
          <LoadingPage
            subtitle={
              {
                wantToPlay: T.loadingPage.wantToPlay,
                playing: T.loadingPage.playing,
                completed: T.loadingPage.completed,
              }[cat] ?? T.loadingPage.subtitle
            }
          />
        ) : error ? (
          <p className="text-red-400 text-sm text-center mt-10">{error}</p>
        ) : games.length === 0 ? (
          <EmptyState
            icon={EMPTY_STATE[cat]?.icon ?? '🎮'}
            title={EMPTY_STATE[cat]?.title ?? ''}
            subtitle={EMPTY_STATE[cat]?.sub ?? ''}
            className="min-h-[60vh]"
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StatusPageHeader
                consoleName={
                  selected.size === 1
                    ? consolePills.find((c) => selected.has(c.id))?.name
                    : undefined
                }
                category={cat}
                gameCount={visibleGames.length}
              />
              <div className="flex items-center gap-2">
                {cat === 'completed' && (
                  <CompletedFilter value={completedMode} onChange={setCompletedMode} />
                )}
                <StatusSortControl cat={cat} sortState={sortState} onChange={setSortState} />
                <StatusGridControl cols={gridCols} onChange={setGridCols} />
              </div>
            </div>
            {consolePills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 py-1">
                <ConsoleFilter
                  pills={consolePills}
                  selected={selected}
                  onToggle={toggle}
                  onClear={clear}
                />
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
        )}
      </div>
    </motion.div>
  )
}
