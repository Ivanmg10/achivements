import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import type { PsnTrophy } from '@/types/psn'

/**
 * Which of a PSN game's trophies the user has pinned, and a toggle — like
 * useSteamFavoriteAchievements: stored in pinned_achievements under source
 * 'psn', so they show up in the main page's pinned card. Toggling is
 * optimistic and rolls back, saying so, if the request fails.
 */
export function usePsnFavoriteTrophies(gameId: number, gameTitle: string) {
  const { T } = useLanguage()
  const { status } = useSession()
  const [pinned, setPinned] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let current = true
    fetch(`/api/favorites?source=psn&gameId=${gameId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load pinned trophies (${res.status})`)
        return res.json()
      })
      .then((rows: { psn_trophy_id: number }[]) => {
        if (current && Array.isArray(rows)) setPinned(new Set(rows.map((r) => r.psn_trophy_id)))
      })
      .catch((err) => {
        console.error('[usePsnFavoriteTrophies]', gameId, err)
        if (current) setError(err instanceof Error ? err.message : 'Unknown error')
      })
    return () => {
      current = false
    }
  }, [gameId, status])

  const toggle = useCallback(
    async (trophy: PsnTrophy) => {
      const wasPinned = pinned.has(trophy.id)
      const flip = (set: Set<number>) => {
        const next = new Set(set)
        if (next.has(trophy.id)) next.delete(trophy.id)
        else next.add(trophy.id)
        return next
      }
      setPinned(flip)
      setError(null)
      try {
        const res = wasPinned
          ? await fetch(`/api/favorites?psnTrophyId=${trophy.id}&gameId=${gameId}`, { method: 'DELETE' })
          : await fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source: 'psn', psnTrophyId: trophy.id, achievement: trophy, gameId, gameTitle }),
            })
        if (!res.ok) throw new Error(`Failed to update pin (${res.status})`)
        notify.success(T.toast.achievementsUpdated)
      } catch (err) {
        console.error('[usePsnFavoriteTrophies] toggle', trophy.id, err)
        setPinned(flip)
        setError(err instanceof Error ? err.message : 'Unknown error')
        notify.error(T.toast.achievementsFailed)
      }
    },
    [pinned, gameId, gameTitle, T],
  )

  return { pinned, toggle, error, canPin: status === 'authenticated' }
}
