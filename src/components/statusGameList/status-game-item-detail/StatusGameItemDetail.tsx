'use client'

import { useGameProgression } from '@/hooks/useGameProgression'
import RaLibraryDetail from '@/components/ra-library-detail/RaLibraryDetail'
import type { CategoryGame } from '@/hooks/useGamesByCategory'

/** An RA game's opened detail. Mounted only while it is open, so the game is asked for on first open. */
export default function StatusGameItemDetail({ game, gameId, category }: { game: CategoryGame; gameId: number | string; category?: string }) {
  const { game: data, isLoading, error, refetch } = useGameProgression(String(gameId))
  return (
    <RaLibraryDetail
      game={game}
      gameId={gameId}
      category={category}
      data={data}
      loading={isLoading || (!data && !error)}
      error={!!error}
      onRetry={refetch}
    />
  )
}
