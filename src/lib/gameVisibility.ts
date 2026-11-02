import { hiddenGameKeys } from '@/lib/publicUser'
import { filterHiddenAwards, filterHiddenGames } from '@/utils/gameVisibility'
import type { GameSource } from '@/types/steam'
import type { UserAwards } from '@/types/types'

/** Filter after the canonical upstream/cache read, using the data owner's keys. */
export async function visibleGamesForUser<T>(userId: string, games: T[], source: GameSource, id?: (game: T) => number): Promise<T[]> {
  const hidden = await hiddenGameKeys(Number(userId))
  return filterHiddenGames(games, source, hidden, id)
}

export async function visibleAwardsForUser(userId: string, awards: UserAwards): Promise<UserAwards> {
  return filterHiddenAwards(awards, await hiddenGameKeys(Number(userId)))
}
