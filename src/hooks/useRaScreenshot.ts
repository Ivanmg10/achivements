import { useEffect, useState } from 'react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

/**
 * A screenshot of an RA game, wide like the art the other platforms give: its
 * title screen, or a frame of play when it has no title screen, as the game
 * page's own backdrop does. One call through /api/getGameData, which the server
 * caches. Nothing until it arrives, and nothing for a game with neither or when
 * the call fails: the caller keeps its icon.
 */
export function useRaScreenshot(gameId: number | null): string | undefined {
  const [shot, setShot] = useState<{ id: number; url?: string }>()

  useEffect(() => {
    if (gameId === null) return
    let cancelled = false
    fetchWithRetry(`/api/getGameData?gameId=${gameId}`)
      .then((data) => {
        const d = data as { ImageTitle?: string | null; ImageIngame?: string | null }
        const path = d.ImageTitle || d.ImageIngame
        if (!cancelled) setShot({ id: gameId, url: path ? `https://retroachievements.org${path}` : undefined })
      })
      .catch((err) => {
        console.error('[useRaScreenshot]', gameId, err)
        if (!cancelled) setShot({ id: gameId, url: undefined })
      })
    return () => {
      cancelled = true
    }
  }, [gameId])

  // An answer for another game is not this one's.
  return shot && shot.id === gameId ? shot.url : undefined
}
