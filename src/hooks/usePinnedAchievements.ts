import { useCallback, useEffect, useMemo } from 'react'
import { keepAnswer } from '@/lib/lastAnswers'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useRetryingRead } from '@/hooks/useRetryingRead'
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
const PINS_URL = '/api/favorites?source=all'
const NONE: PinnedAchievement[] = []
const asPins = (data: unknown) => (Array.isArray(data) ? (data as PinnedAchievement[]) : NONE)

export function usePinnedAchievements() {
  const { T } = useLanguage()
  const { isHidden, isLoading: hiddenLoading } = useHiddenGames()
  const user = useAuthSession().data?.user?.id
  const read = useRetryingRead(PINS_URL, { parse: asPins, keepFor: user })
  const pinned = read.data ?? NONE
  const { setData: setPinned, refetch } = read

  // What is shown is what the next visit starts from, an unpin or a new order included.
  useEffect(() => {
    if (read.data && !read.error) keepAnswer(user, PINS_URL, read.data)
  }, [read.data, read.error, user])

  const unpin = useCallback(async (fav: PinnedAchievement) => {
    const key = pinnedKey(fav)
    let removedAt = -1
    setPinned((prev) => {
      removedAt = (prev ?? NONE).findIndex((p) => pinnedKey(p) === key)
      return (prev ?? NONE).filter((p) => pinnedKey(p) !== key)
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
        if (prev?.some((p) => pinnedKey(p) === key)) return prev
        const next = [...(prev ?? NONE)]
        next.splice(removedAt < 0 ? next.length : removedAt, 0, fav)
        return next
      })
    }
  }, [T, setPinned])

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
  }, [pinned, T, setPinned])

  const visible = useMemo(() => hiddenLoading ? [] : pinned.filter((item) => !isHidden(item.game_id, item.source)), [pinned, isHidden, hiddenLoading])
  return { pinned: visible, isLoading: hiddenLoading || read.isLoading, error: read.error, refetch, unpin, reorder }
}
