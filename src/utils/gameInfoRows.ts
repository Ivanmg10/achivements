import type { InfoRow } from '@/components/library-game-detail/library-detail-info/LibraryDetailInfo'

type Labels = { console: string; developer: string; publisher: string; genre: string; released: string }

export type GameFacts = {
  console?: string | null
  developers?: readonly string[]
  publishers?: readonly string[]
  genres?: readonly string[]
  /** Already in the reader's language (`formatDay`, `formatStoreDate`, a year). */
  released?: string | null
}

/** What is known of a game, as the rows of "About the game", in its order; what is not known is left out. */
export function gameInfoRows(L: Labels, f: GameFacts): InfoRow[] {
  return [
    { label: L.console, value: f.console ?? '' },
    { label: L.developer, value: f.developers?.join(', ') ?? '' },
    { label: L.publisher, value: f.publishers?.join(', ') ?? '' },
    { label: L.genre, value: f.genres?.join(', ') ?? '' },
    { label: L.released, value: f.released ?? '' },
  ].filter((r) => r.value)
}
