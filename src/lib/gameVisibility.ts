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

/**
 * The SQL that leaves a hidden game out, for a row `row` with `source` and `game_id`
 * (`user` is whose hidden list: the row's own `user_id` unless said otherwise). Every
 * listing, ranking and total query interpolates it, as presenceColumns does for
 * presence. Both are SQL written in code, never a value from a request.
 */
export function notHidden(row: string, user = `${row}.user_id`): string {
  return `NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = ${user} AND h.source = ${row}.source AND h.game_id = ${row}.game_id)`
}
