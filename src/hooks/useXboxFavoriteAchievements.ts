import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useSubject } from '@/context/SubjectContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'
import type { XboxAchievement } from '@/types/xbox'

/**
 * Which of an Xbox game's achievements the user has pinned, and a toggle — like
 * usePsnFavoriteTrophies: stored in pinned_achievements under source 'xbox', so
 * they show up in the main page's pinned card. Toggling is optimistic and rolls
 * back, saying so, if the request fails.
 */
export function useXboxFavoriteAchievements(gameId: number, gameTitle: string) {
  const { T } = useLanguage()
  const { status, data: session } = useAuthSession()
  const user = session?.user?.id
  const url = `/api/favorites?source=xbox&gameId=${gameId}`
  // Pins are the viewer's own; on someone else's page they are not offered.
  const subject = useSubject()
  // Coming back to a game: its pins as they showed, at once, while they are read again (lastAnswers).
  const [pinned, setPinned] = useState<Set<string>>(() => new Set(lastAnswer<string[]>(user, url) ?? []))
  /**
   * The pins as they were when the page loaded: what a list orders by. Pinning
   * then leaves the row where it is — moved to the top, it took the focused star
   * with it, and the browser scrolled up after it.
   */
  const [leading, setLeading] = useState<Set<string>>(() => new Set(lastAnswer<string[]>(user, url) ?? []))
  const [error, setError] = useState<string | null>(null)
  const loadedUrl = useRef<string | null>(null)

  // What is shown is what the next visit starts from, a pin just added included.
  useEffect(() => {
    if (loadedUrl.current === url) keepAnswer(user, url, [...pinned])
  }, [pinned, user, url])

  useEffect(() => {
    if (status !== 'authenticated') return
    let current = true
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load pinned achievements (${res.status})`)
        return res.json()
      })
      .then((rows: { xbox_achievement_id: string }[]) => {
        if (current && Array.isArray(rows)) {
          const ids = new Set(rows.map((r) => r.xbox_achievement_id))
          loadedUrl.current = url
          keepAnswer(user, url, [...ids])
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
  }, [gameId, status, url])

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
