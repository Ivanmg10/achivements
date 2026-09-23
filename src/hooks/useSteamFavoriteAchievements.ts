import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * Which of a Steam game's achievements the user has pinned, and a toggle —
 * the Steam side of RA's pin star, stored in the same pinned_achievements
 * table under source 'steam', so they show up in the main page's pinned card.
 *
 * Toggling is optimistic and rolls back if the request fails.
 */
export function useSteamFavoriteAchievements(appId: number, gameTitle: string) {
  const { status } = useSession()
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let current = true
    setPinned(new Set())
    setError(null)
    fetch(`/api/favorites?source=steam&gameId=${appId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load pinned achievements (${res.status})`)
        return res.json()
      })
      .then((rows: { steam_apiname: string }[]) => {
        if (current && Array.isArray(rows)) setPinned(new Set(rows.map((r) => r.steam_apiname)))
      })
      .catch((err) => {
        console.error('[useSteamFavoriteAchievements]', appId, err)
        if (current) setError(err instanceof Error ? err.message : 'Unknown error')
      })
    return () => {
      current = false
    }
  }, [appId, status])

  const toggle = useCallback(
    async (achievement: SteamAchievementUnified) => {
      const wasPinned = pinned.has(achievement.apiname)
      const flip = (set: Set<string>) => {
        const next = new Set(set)
        if (next.has(achievement.apiname)) next.delete(achievement.apiname)
        else next.add(achievement.apiname)
        return next
      }
      setPinned(flip)
      setError(null)
      try {
        const res = wasPinned
          ? await fetch(
              `/api/favorites?steamApiname=${encodeURIComponent(achievement.apiname)}&gameId=${appId}`,
              { method: 'DELETE' },
            )
          : await fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source: 'steam',
                steamApiname: achievement.apiname,
                achievement,
                gameId: appId,
                gameTitle,
              }),
            })
        if (!res.ok) throw new Error(`Failed to update pin (${res.status})`)
      } catch (err) {
        console.error('[useSteamFavoriteAchievements] toggle', achievement.apiname, err)
        setPinned(flip)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    },
    [pinned, appId, gameTitle],
  )

  return { pinned, toggle, error, canPin: status === 'authenticated' }
}
