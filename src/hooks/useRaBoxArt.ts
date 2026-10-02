import { useEffect, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

/**
 * The box art of a few RA games (the cover the game page shows), by id.
 * One call per game through /api/getGameData, which the server caches, so a
 * podium of three costs three lookups once. A 5xx is asked again a couple of
 * times (RA throttles in bursts); a game whose art still fails to come back
 * simply has none here, and the caller falls back to its icon.
 */
export function useRaBoxArt(gameIds: number[]): Record<number, string | undefined> {
  const [art, setArt] = useState<Record<number, string | undefined>>({})
  const key = gameIds.join(',')

  useEffect(() => {
    if (!key) return
    let cancelled = false
    const ids = key.split(',').map(Number)

    Promise.all(
      ids.map(async (id) => {
        try {
          const data = (await fetchWithRetry(`/api/getGameData?gameId=${id}`)) as { ImageBoxArt?: string }
          return [id, data.ImageBoxArt ? `https://retroachievements.org${data.ImageBoxArt}` : undefined] as const
        } catch (err) {
          console.error('[useRaBoxArt]', id, err)
          return [id, undefined] as const
        }
      }),
    ).then((entries) => {
      if (!cancelled) setArt(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
  }, [key])

  return art
}
