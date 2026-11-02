import type { PsnGameProgress, PsnTrophy } from '@/types/psn'
import { psnBaseCompletedAt, validCompletionDate } from '@/utils/completionDates'
import { mapLimit } from '@/utils/utils'

const COMPLETION_PARALLEL = 2
const needsBaseTrophies = (game: PsnGameProgress) => game.hasDlc && (game.pctWon >= 100 || game.earned.platinum > 0)

/** Add nullable base dates without caching a partial enrichment or changing activity fields. */
export async function withPsnCompletionDates(
  games: PsnGameProgress[],
  loadTrophies: (game: PsnGameProgress) => Promise<PsnTrophy[]>,
): Promise<PsnGameProgress[]> {
  const eligible = games.filter(needsBaseTrophies)
  const results = await mapLimit(eligible, COMPLETION_PARALLEL, async (game) => psnBaseCompletedAt(await loadTrophies(game)))
  const dates = new Map<number, string | null>()
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') dates.set(eligible[index].id, result.value)
    else {
      console.error('[psn] completion date unavailable', eligible[index].titleId, result.reason)
      dates.set(eligible[index].id, null)
    }
  })
  return games.map((game) => {
    if (needsBaseTrophies(game)) return { ...game, completedAt: dates.get(game.id) ?? null }
    if (!game.hasDlc && game.pctWon >= 100) return { ...game, completedAt: validCompletionDate(game.lastTrophyAt) }
    return game
  })
}
