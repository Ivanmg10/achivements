import type { XboxAchievement, XboxGameProgress } from '@/types/xbox'
import { xboxFullSetCompletedAt } from '@/utils/completionDates'
import { classifyXboxGame } from '@/utils/xboxTitles'
import { mapLimit } from '@/utils/utils'

const COMPLETION_PARALLEL = 2

/** Add full-set completion dates without caching a partial enrichment or changing activity fields. */
export async function withXboxCompletionDates(
  games: XboxGameProgress[],
  loadAchievements: (game: XboxGameProgress) => Promise<XboxAchievement[]>,
): Promise<XboxGameProgress[]> {
  const completed = games.filter((game) => classifyXboxGame(game) === 'completed')
  const results = await mapLimit(completed, COMPLETION_PARALLEL, async (game) => xboxFullSetCompletedAt(await loadAchievements(game)))
  const dates = new Map<number, string | null>()
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') dates.set(completed[index].id, result.value)
    else {
      console.error('[xbox] completion date unavailable', completed[index].titleId, result.reason)
      dates.set(completed[index].id, null)
    }
  })
  return games.map((game) => classifyXboxGame(game) === 'completed' ? { ...game, completedAt: dates.get(game.id) ?? null } : game)
}
