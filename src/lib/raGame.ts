import { withCache } from '@/lib/raCache'
import { getGame } from '@/lib/raClient'

export const GAME_TTL_MS = 4 * 60 * 60 * 1000

/** RA's facts of a game, shared by every route that reads them. */
export function cachedGame(gameId: string, apiKey: string) {
  return withCache(
    `gameData_v2:${gameId}`,
    GAME_TTL_MS,
    () => getGame(gameId, apiKey),
    // API_GetGame answers with Title, ImageBoxArt, Released… but no ID field:
    // checking for 'ID' threw every real answer away and returned 503.
    (d) => d !== null && typeof d === 'object' && 'Title' in d,
  )
}
