import { useCallback, useEffect, useState } from 'react'
import type { RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'

type FavoriteMeta = { gameTitle?: string | null; numDistinctPlayers: number }

/**
 * Which of a RetroAchievements game's achievements the user has pinned, and a
 * toggle for them. The toggle is optimistic and undoes itself when the server
 * says no, so the star never shows a state that was not saved. `enabled`
 * lets a collapsed row wait until it is opened before asking.
 */
export function useRaFavoriteIds(gameId: number | string | null | undefined, enabled = true) {
  const { T } = useLanguage()
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!gameId || !enabled) return
    let current = true
    fetch(`/api/favorites?gameId=${gameId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load favorites (${r.status})`)
        return r.json()
      })
      .then((rows: { achievement_id: number }[]) => {
        if (current) setFavoritedIds(new Set(rows.map((r) => r.achievement_id)))
      })
      // Nothing to show but empty stars; the pins themselves are safe on the server.
      .catch((err) => console.error('[useRaFavoriteIds] load', err))
    return () => {
      current = false
    }
  }, [gameId, enabled])

  const toggleFavorite = useCallback(
    async (achievement: RetroAchievement, meta: FavoriteMeta) => {
      const isFav = favoritedIds.has(achievement.ID)
      const flip = (add: boolean) =>
        setFavoritedIds((prev) => {
          const next = new Set(prev)
          if (add) next.add(achievement.ID)
          else next.delete(achievement.ID)
          return next
        })

      flip(!isFav)
      try {
        const res = isFav
          ? await fetch(`/api/favorites?achievementId=${achievement.ID}`, { method: 'DELETE' })
          : await fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ achievement, gameId, ...meta }),
            })
        if (!res.ok) throw new Error(`Failed to ${isFav ? 'unpin' : 'pin'} achievement (${res.status})`)
        notify.success(T.toast.achievementsUpdated)
      } catch (err) {
        console.error('[useRaFavoriteIds] toggle', err)
        flip(isFav)
        notify.error(T.toast.achievementsFailed)
      }
    },
    [favoritedIds, gameId, T]
  )

  return { favoritedIds, toggleFavorite }
}
