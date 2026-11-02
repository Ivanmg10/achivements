import { useCallback, useEffect, useRef, useState } from 'react'
import type { RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { useAuthSession } from '@/hooks/useAuthSession'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'

type FavoriteMeta = { gameTitle?: string | null; numDistinctPlayers: number }

/**
 * Which of a RetroAchievements game's achievements the user has pinned, and a
 * toggle for them. The toggle is optimistic and undoes itself when the server
 * says no, so the star never shows a state that was not saved. `enabled`
 * lets a collapsed row wait until it is opened before asking.
 */
export function useRaFavoriteIds(gameId: number | string | null | undefined, enabled = true) {
  const { T } = useLanguage()
  const user = useAuthSession().data?.user?.id
  const url = `/api/favorites?gameId=${gameId}`
  // Coming back to a game: its pins as they showed, at once, while they are read again (lastAnswers).
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(() => new Set(lastAnswer<number[]>(user, url) ?? []))
  /** The pins as they loaded: what a list orders by, so pinning leaves the row (and the page) where it is. */
  const [leadingIds, setLeadingIds] = useState<Set<number>>(() => new Set(lastAnswer<number[]>(user, url) ?? []))
  const loadedUrl = useRef<string | null>(null)

  // What is shown is what the next visit starts from, a pin just added included.
  useEffect(() => {
    if (loadedUrl.current === url) keepAnswer(user, url, [...favoritedIds])
  }, [favoritedIds, user, url])

  useEffect(() => {
    if (!gameId || !enabled) return
    let current = true
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load favorites (${r.status})`)
        return r.json()
      })
      .then((rows: { achievement_id: number }[]) => {
        if (!current) return
        const ids = new Set(rows.map((r) => r.achievement_id))
        loadedUrl.current = url
        keepAnswer(user, url, [...ids])
        setFavoritedIds(ids)
        setLeadingIds(ids)
      })
      // Nothing to show but empty stars; the pins themselves are safe on the server.
      .catch((err) => console.error('[useRaFavoriteIds] load', err))
    return () => {
      current = false
    }
  }, [gameId, enabled, url])

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

  return { favoritedIds, leadingIds, toggleFavorite }
}
