import type { PsnGameProgress } from '@/types/psn'
import { validCompletionDate } from '@/utils/completionDates'

/** A complete game with DLC: its base-game completion date needs its trophies read (psnBaseCompletedAt). */
export const needsBaseTrophies = (game: PsnGameProgress) => game.hasDlc && (game.pctWon >= 100 || game.earned.platinum > 0)

/**
 * Each game's completion date: a complete game without DLC from its last trophy; one with DLC from `known` (its
 * base game's date, read in the background; null until then). Activity fields are left alone.
 */
export function withCompletion(games: PsnGameProgress[], known: (game: PsnGameProgress) => string | null): PsnGameProgress[] {
  return games.map((game) => {
    if (needsBaseTrophies(game)) return { ...game, completedAt: known(game) }
    if (!game.hasDlc && game.pctWon >= 100) return { ...game, completedAt: validCompletionDate(game.lastTrophyAt) }
    return game
  })
}
