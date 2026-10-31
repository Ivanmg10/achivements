import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { pinnedKey } from '@/utils/utils'
import type { PinnedAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { useHiddenGames } from '@/context/HiddenGamesContext'

/**
 * The user's own pinned achievements (their goals, "achievements to get") across RA,
 * Steam, PSN and Xbox, in their order. Never someone else's: others see the showcase.
 *
 * A load that still fails after fetchWithRetry's own attempts is retried in
 * the background with a growing delay (see scheduleRetry); once that gives
 * up, `error` is set so the card can say so and offer a retry. Unpinning is
 * optimistic and puts the row back if the request fails.
 */
export function usePinnedAchievements() {
  const { T } = useLanguage()
  const { isHidden, isLoading: hiddenLoading } = useHiddenGames()
  const [pinned, setPinned] = useState<PinnedAchievement[]>([])
  /** Which load the answer (data or final failure) belongs to; loading is any other being asked for. */
  const [loadedKey, setLoadedKey] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const attemptRef = useRef(0)

  useEffect(() => {
    let current = true
    // This run's own retry timer, cleared when the run is replaced or unmounted.
    const retryTimer: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined }
    attemptRef.current = 0

    function load() {
      fetchWithRetry('/api/favorites?source=all')
        .then((data) => {
          if (!current) return
          setPinned(Array.isArray(data) ? (data as PinnedAchievement[]) : [])
          setFailed(false)
          setLoadedKey(reloadKey)
          attemptRef.current = 0
        })
        .catch((err) => {
          if (!current) return
          console.error('[usePinnedAchievements]', err)
          if (!scheduleRetry(attemptRef, retryTimer, load, err)) {
            setFailed(true)
            setLoadedKey(reloadKey)
          }
        })
    }

    load()
    return () => {
      current = false
      clearTimeout(retryTimer.current)
    }
  }, [reloadKey])

  const refetch = useCallback(() => {
    setPinned([])
    setFailed(false)
    setReloadKey((k) => k + 1)
  }, [])

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
        : fav.source === 'psn'
          ? `/api/favorites?psnTrophyId=${fav.psn_trophy_id}&gameId=${fav.game_id}`
          : fav.source === 'xbox'
            ? `/api/favorites?xboxAchievementId=${encodeURIComponent(fav.xbox_achievement_id)}&gameId=${fav.game_id}`
            : `/api/favorites?achievementId=${fav.achievement_id}`
    try {
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed to unpin (${res.status})`)
      notify.success(T.toast.achievementsUpdated)
    } catch (err) {
      console.error('[usePinnedAchievements] unpin', key, err)
      notify.error(T.toast.achievementsFailed)
      setPinned((prev) => {
        if (prev.some((p) => pinnedKey(p) === key)) return prev
        const next = [...prev]
        next.splice(removedAt < 0 ? next.length : removedAt, 0, fav)
        return next
      })
    }
  }, [T])

  /** Puts the pins in a new order at once, and back (saying so) if it could not be saved. */
  const reorder = useCallback(async (next: PinnedAchievement[]) => {
    const before = pinned
    setPinned(next)
    try {
      const res = await fetch('/api/favorites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: next.flatMap((p) => (p.id ? [p.id] : [])) }),
      })
      if (!res.ok) throw new Error(`Failed to save the order (${res.status})`)
    } catch (err) {
      console.error('[usePinnedAchievements] reorder', err)
      notify.error(T.toast.orderFailed)
      setPinned(before)
    }
  }, [pinned, T])

  const answered = loadedKey === reloadKey
  const visible = useMemo(() => hiddenLoading ? [] : pinned.filter((item) => !isHidden(item.game_id, item.source)), [pinned, isHidden, hiddenLoading])
  return { pinned: visible, isLoading: hiddenLoading || !answered, error: answered && failed, refetch, unpin, reorder }
}
