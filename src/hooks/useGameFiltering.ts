import { useMemo } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { CategoryGame } from './useGamesByCategory'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'
import { CompletedMode } from '@/components/completed-filter/CompletedFilter'
import { StatusSortState } from '@/components/status-sort-control/StatusSortControl'
import { compareSortValues, getGameSortValue } from '@/utils/utils'

export function useGameFiltering({
  games,
  cat,
  extraData,
  selected,
  completedMode,
  sortState,
}: {
  games: CategoryGame[]
  cat: string
  extraData: Map<number, GameExtraData>
  selected: Set<number>
  completedMode: CompletedMode
  sortState: StatusSortState
}): CategoryGame[] {
  return useMemo(() => {
    let list = games
    if (selected.size > 0) list = list.filter((g) => selected.has(g.ConsoleID))
    if (cat === 'completed' && completedMode !== 'all') {
      list = list.filter((g) => {
        const hc = Number((g as RetroAchievementsGameCompleted).HardcoreMode)
        return completedMode === 'hardcore' ? hc === 1 : hc === 0
      })
    }
    list = [...list].sort((a, b) => {
      const aExtra = extraData.get(a.GameID ?? (a.ID as number))
      const bExtra = extraData.get(b.GameID ?? (b.ID as number))
      const aVal = getGameSortValue(a, aExtra, sortState.key)
      const bVal = getGameSortValue(b, bExtra, sortState.key)
      return compareSortValues(aVal, bVal, sortState.dir)
    })
    return list
  }, [games, cat, selected, completedMode, sortState, extraData])
}
