import { useEffect, useState } from 'react'
import { raArt } from '@/lib/raArtStore'
import { raImageUrl } from '@/utils/raAssets'

/**
 * A screenshot of an RA game, wide like the art the other platforms give: its
 * title screen, or a frame of play when it has no title screen, as the game
 * page's own backdrop does. Kept in this browser once read (raArt). Nothing
 * until it arrives, and nothing for a game with neither or when the call
 * fails: the caller keeps its icon.
 */
export function useRaScreenshot(gameId: number | null): string | undefined {
  const [shot, setShot] = useState<{ id: number; url?: string }>()

  useEffect(() => {
    if (gameId === null) return
    let cancelled = false
    raArt(gameId).then((art) => {
      const path = art?.title || art?.ingame
      if (!cancelled) setShot({ id: gameId, url: raImageUrl(path) })
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  // An answer for another game is not this one's.
  return shot && shot.id === gameId ? shot.url : undefined
}
