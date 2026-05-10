import { useMemo } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { CategoryGame } from './useGamesByCategory'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'
import { CompletedMode } from '@/components/completed-filter/CompletedFilter'

export function useGameFiltering({
  games,
  cat,
  extraData,
  selected,
  completedMode,
}: {
  games: CategoryGame[]
  cat: string
  extraData: Map<number, GameExtraData>
  selected: Set<number>
  completedMode: CompletedMode
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
    if (cat === 'playing' || cat === 'completed') {
      list = [...list].sort((a, b) => {
        const aId = a.GameID ?? (a.ID as number)
        const bId = b.GameID ?? (b.ID as number)
        const aExtra = extraData.get(aId)
        const bExtra = extraData.get(bId)
        const aDate = cat === 'playing' ? aExtra?.lastPlayed : aExtra?.awards?.[0]?.AwardedAt
        const bDate = cat === 'playing' ? bExtra?.lastPlayed : bExtra?.awards?.[0]?.AwardedAt
        if (!aDate && !bDate) return 0
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
    }
    return list
  }, [games, cat, selected, completedMode, extraData])
}
