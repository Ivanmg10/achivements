'use client'

import { useParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import { useGamesByCategory } from '../../../../hooks/useGamesByCategory'
import { useGameExtraData } from '../../../../hooks/useGameExtraData'
import { useConsoleFilter } from '../../../../hooks/useConsoleFilter'
import { useGameFiltering } from '../../../../hooks/useGameFiltering'
import StatusGameList from '../../../../components/statusGameList/StatusGameList'
import StatusPageHeader from '../../../../components/status-page-header/StatusPageHeader'
import CompletedFilter, { CompletedMode } from '../../../../components/completed-filter/CompletedFilter'
import ConsoleFilter, { buildConsolePills } from '@/components/console-filter/ConsoleFilter'
import StatusSortControl, {
  StatusSortState,
  defaultSortStateFor,
} from '@/components/status-sort-control/StatusSortControl'
import StatusEmptyState from '@/components/status-empty-state/StatusEmptyState'
import StatusPageSkeleton from '@/components/status-page-skeleton/StatusPageSkeleton'

export default function CategoryConsolePage() {
  const { consoleId, category } = useParams()
  const { games, loading, error } = useGamesByCategory(category as string)
  const extraData = useGameExtraData()
  const [completedMode, setCompletedMode] = useState<CompletedMode>('all')
  const { selected, toggle, clear } = useConsoleFilter(
    consoleId ? [Number(consoleId)] : undefined
  )
  const cat = category as string
  const [sortState, setSortState] = useState<StatusSortState>(() => defaultSortStateFor(cat))

  // A different category starts from its own default order; adjusted during
  // render, so the old order is never shown for a frame.
  const [sortFor, setSortFor] = useState(cat)
  if (sortFor !== cat) {
    setSortFor(cat)
    setSortState(defaultSortStateFor(cat))
  }


  const consolePills = useMemo(() => buildConsolePills(games), [games])
  const visibleGames = useGameFiltering({ games, cat, extraData, selected, completedMode, sortState })

  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-3">
        {loading ? (
          <StatusPageSkeleton />
        ) : error ? (
          <p className="text-red-400 text-sm text-center mt-10">{error}</p>
        ) : games.length === 0 ? (
          <StatusEmptyState category={cat} className="min-h-[60vh]" />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StatusPageHeader
                consoleName={selected.size === 1
                  ? consolePills.find((c) => selected.has(c.id))?.name
                  : undefined}
                category={cat}
                gameCount={visibleGames.length}
              />
              <div className="flex items-center gap-2">
                {cat === 'completed' && (
                  <CompletedFilter value={completedMode} onChange={setCompletedMode} />
                )}
                <StatusSortControl cat={cat} sortState={sortState} onChange={setSortState} />
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
              <StatusEmptyState category={cat} className="min-h-[40vh]" />
            ) : (
              <StatusGameList games={visibleGames} extraData={extraData} category={cat} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
