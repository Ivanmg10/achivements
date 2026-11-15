import type { GameStatus } from '@/types/game'

/** The pages of the library: one per status, and "all", every status at once (`/allGames`). */
export type LibraryCategory = GameStatus | 'all'

export const GAME_STATUSES: readonly GameStatus[] = ['playing', 'completed', 'wantToPlay']

/** Whether a game in this status belongs on this page: "all" takes every status, never one that is not known. */
export function inCategory(status: GameStatus | null, category: string): boolean {
  return status !== null && (category === 'all' || status === category)
}

/** The status a game's list opens its detail as: its page's, or on "all" the game's own. */
export const detailCategory = (category: string, status: GameStatus): GameStatus => (category === 'all' ? status : (category as GameStatus))
