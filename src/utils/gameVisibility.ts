import { gameKey } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'
import type { UserAwards } from '@/types/types'

export type HiddenGameKeys = ReadonlySet<string> | readonly string[]

const includes = (hidden: HiddenGameKeys, key: string) => ('has' in hidden ? hidden.has(key) : hidden.includes(key))

/** One visibility rule for every listing DTO: platform and numeric id, never the id alone. */
export function filterHiddenGames<T>(games: T[], source: GameSource, hidden: HiddenGameKeys, id: (game: T) => number = (game) => (game as { id: number }).id): T[] {
  return games.filter((game) => !includes(hidden, gameKey(source, id(game))))
}

/** RA awards are listings too, and their headline counts must follow the filtered list. */
export function filterHiddenAwards(awards: UserAwards, hidden: HiddenGameKeys): UserAwards {
  const visible = filterHiddenGames(awards.VisibleUserAwards ?? [], 'ra', hidden, (award) => award.AwardData)
  const mastery = visible.filter((award) => award.AwardType === 'Mastery/Completion' && award.AwardDataExtra === 1).length
  const completion = visible.filter((award) => award.AwardType === 'Mastery/Completion' && award.AwardDataExtra !== 1).length
  const beatenHardcore = visible.filter((award) => award.AwardType === 'Game Beaten' && award.AwardDataExtra === 1).length
  const beatenSoftcore = visible.filter((award) => award.AwardType === 'Game Beaten' && award.AwardDataExtra !== 1).length
  return {
    TotalAwardsCount: visible.length,
    MasteryAwardsCount: mastery,
    CompletionAwardsCount: completion,
    BeatenHardcoreAwardsCount: beatenHardcore,
    BeatenSoftcoreAwardsCount: beatenSoftcore,
    EventAwardsCount: visible.length - mastery - completion - beatenHardcore - beatenSoftcore,
    VisibleUserAwards: visible,
  }
}
