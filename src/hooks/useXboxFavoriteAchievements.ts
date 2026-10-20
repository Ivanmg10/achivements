import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSubject } from '@/context/SubjectContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import type { XboxAchievement } from '@/types/xbox'

/**
 * Which of an Xbox game's achievements the user has pinned, and a toggle — like
 * usePsnFavoriteTrophies: stored in pinned_achievements under source 'xbox', so
 * they show up in the main page's pinned card. Toggling is optimistic and rolls
 * back, saying so, if the request fails.
 */
export function useXboxFavoriteAchievements(gameId: number, gameTitle: string) {
  const { T } = useLanguage()
  const { status } = useSession()
  // Pins are the viewer's own; on someone else's page they are not offered.
  const subject = useSubject()
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  /**
   * The pins as they were when the page loaded: what a list orders by. Pinning
   * then leaves the row where it is — moved to the top, it took the focused star
   * with it, and the browser scrolled up after it.
   */
  const [leading, setLeading] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    let current = true
    fetch(`/api/favorites?source=xbox&gameId=${gameId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load pinned achievements (${res.status})`)
        return res.json()
      })
      .then((rows: { xbox_achievement_id: string }[]) => {
        if (current && Array.isArray(rows)) {
          const ids = new Set(rows.map((r) => r.xbox_achievement_id))
          setPinned(ids)
          setLeading(ids)
        }
      })
      .catch((err) => {
        console.error('[useXboxFavoriteAchievements]', gameId, err)
        if (current) setError(err instanceof Error ? err.message : 'Unknown error')
      })
    return () => {
      current = false
    }
  }, [gameId, status])

  const toggle = useCallback(
    async (achievement: XboxAchievement) => {
      const wasPinned = pinned.has(achievement.id)
      const flip = (set: Set<string>) => {
        const next = new Set(set)
        if (next.has(achievement.id)) next.delete(achievement.id)
        else next.add(achievement.id)
        return next
      }
      setPinned(flip)
      setError(null)
      try {
        const res = wasPinned
          ? await fetch(`/api/favorites?xboxAchievementId=${encodeURIComponent(achievement.id)}&gameId=${gameId}`, { method: 'DELETE' })
          : await fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source: 'xbox', xboxAchievementId: achievement.id, achievement, gameId, gameTitle }),
            })
        if (!res.ok) throw new Error(`Failed to update pin (${res.status})`)
        notify.success(T.toast.achievementsUpdated)
      } catch (err) {
        console.error('[useXboxFavoriteAchievements] toggle', achievement.id, err)
        setPinned(flip)
        setError(err instanceof Error ? err.message : 'Unknown error')
        notify.error(T.toast.achievementsFailed)
      }
    },
    [pinned, gameId, gameTitle, T],
  )

  return { pinned, leading, toggle, error, canPin: status === 'authenticated' && !subject }
}
