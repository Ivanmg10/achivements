import { useRetryingRead } from '@/hooks/useRetryingRead'

export type GameHash = {
  MD5: string
  Name: string
  Labels: string[]
  PatchUrl: string | null
}

// Made once, not per render: the read starts over when `parse` changes.
const parse = (raw: unknown): GameHash[] | null => {
  if (!raw || typeof raw !== 'object') return null
  const results = (raw as { Results?: unknown }).Results
  return Array.isArray(results) ? (results as GameHash[]) : []
}

/** The hashes RetroAchievements registers for a game (read only while `enabled`), retried in the background. */
export function useGameHashes(gameId: number, enabled: boolean) {
  const { data, isLoading, error, refetch } = useRetryingRead<GameHash[]>(enabled ? `/api/getGameHashes?gameId=${gameId}` : null, { parse })
  return { hashes: data ?? [], isLoading, error, retry: refetch }
}
