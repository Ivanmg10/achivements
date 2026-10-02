import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { pinnedKey } from '@/utils/utils'
import type { PinnedAchievement } from '@/types/types'

/**
 * The user's pinned achievements across RA and Steam, newest first — what the
 * main page's pinned card lists, whichever platform is selected.
 *
 * A load that still fails after fetchWithRetry's own attempts is retried in
 * the background with a growing delay (see scheduleRetry); once that gives
 * up, `error` is set so the card can say so and offer a retry. Unpinning is
 * optimistic and puts the row back if the request fails.
 */
export function usePinnedAchievements() {
  const [pinned, setPinned] = useState<PinnedAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const attemptRef = useRef(0)

  useEffect(() => {
    let current = true
    // This run's own retry timer, cleared when the run is replaced or unmounted.
    const retryTimer: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined }
    attemptRef.current = 0
    setIsLoading(true)
    setError(false)
    setPinned([])

    function load() {
      fetchWithRetry('/api/favorites?source=all')
        .then((data) => {
          if (!current) return
          setPinned(Array.isArray(data) ? (data as PinnedAchievement[]) : [])
          setIsLoading(false)
          attemptRef.current = 0
        })
        .catch((err) => {
          if (!current) return
          console.error('[usePinnedAchievements]', err)
          if (!scheduleRetry(attemptRef, retryTimer, load, err)) {
            setError(true)
            setIsLoading(false)
          }
        })
    }

    load()
    return () => {
      current = false
      clearTimeout(retryTimer.current)
    }
  }, [reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  const unpin = useCallback(async (fav: PinnedAchievement) => {
    const key = pinnedKey(fav)
    let removedAt = -1
    setPinned((prev) => {
      removedAt = prev.findIndex((p) => pinnedKey(p) === key)
      return prev.filter((p) => pinnedKey(p) !== key)
    })
    const url =
      fav.source === 'steam'
        ? `/api/favorites?steamApiname=${encodeURIComponent(fav.steam_apiname)}&gameId=${fav.game_id}`
        : `/api/favorites?achievementId=${fav.achievement_id}`
    try {
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed to unpin (${res.status})`)
    } catch (err) {
      console.error('[usePinnedAchievements] unpin', key, err)
      setPinned((prev) => {
        if (prev.some((p) => pinnedKey(p) === key)) return prev
        const next = [...prev]
        next.splice(removedAt < 0 ? next.length : removedAt, 0, fav)
        return next
      })
    }
  }, [])

  return { pinned, isLoading, error, refetch, unpin }
}
