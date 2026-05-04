import { useMemo } from 'react'
import { useRecentlyPlayedGames } from './useRecentlyPlayedGames'
import { useUserAwards } from './useUserAwards'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'

export function useGameExtraData(): Map<number, GameExtraData> {
  const recentGames = useRecentlyPlayedGames()
  const { awards } = useUserAwards()

  return useMemo(() => {
    const map = new Map<number, GameExtraData>()

    for (const g of recentGames) {
      const prev = map.get(g.GameID) ?? { awards: [] }
      map.set(g.GameID, { ...prev, lastPlayed: g.LastPlayed })
    }

    for (const award of awards?.VisibleUserAwards ?? []) {
      const id = award.AwardData
      const prev = map.get(id) ?? { awards: [] }
      map.set(id, { ...prev, awards: [...(prev.awards ?? []), award] })
    }

    return map
  }, [recentGames, awards])
}
