import { useEffect, useState } from 'react'
import { raArt } from '@/lib/raArtStore'

/**
 * The box art of a few RA games (the cover the game page shows), by id: kept in
 * this browser once read (raArt), so a podium of three costs three lookups once,
 * ever. A game whose art fails to come back simply has none here, and the caller
 * falls back to its icon.
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
        const box = (await raArt(id))?.box
        return [id, box ? `https://retroachievements.org${box}` : undefined] as const
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
