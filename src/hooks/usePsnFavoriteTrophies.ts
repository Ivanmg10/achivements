import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useSubject } from '@/context/SubjectContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'
import type { PsnTrophy } from '@/types/psn'

/**
 * Which of a PSN game's trophies the user has pinned, and a toggle — like
 * useSteamFavoriteAchievements: stored in pinned_achievements under source
 * 'psn', so they show up in the main page's pinned card. Toggling is
 * optimistic and rolls back, saying so, if the request fails.
 */
export function usePsnFavoriteTrophies(gameId: number, gameTitle: string) {
  const { T } = useLanguage()
  const { status, data: session } = useAuthSession()
  const user = session?.user?.id
  const url = `/api/favorites?source=psn&gameId=${gameId}`
  // Pins are the viewer's own; on someone else's page they are not offered.
  const subject = useSubject()
  // Coming back to a game: its pins as they showed, at once, while they are read again (lastAnswers).
  const [pinned, setPinned] = useState<Set<number>>(() => new Set(lastAnswer<number[]>(user, url) ?? []))
  /**
   * The pins as they were when the page loaded: what a list orders by. Pinning
   * then leaves the row where it is — moved to the top, it took the focused star
   * with it, and the browser scrolled up after it.
   */
  const [leading, setLeading] = useState<Set<number>>(() => new Set(lastAnswer<number[]>(user, url) ?? []))
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
        if (!res.ok) throw new Error(`Failed to load pinned trophies (${res.status})`)
        return res.json()
      })
      .then((rows: { psn_trophy_id: number }[]) => {
        if (current && Array.isArray(rows)) {
          const ids = new Set(rows.map((r) => r.psn_trophy_id))
          loadedUrl.current = url
          keepAnswer(user, url, [...ids])
          setPinned(ids)
          setLeading(ids)
        }
      })
      .catch((err) => {
        console.error('[usePsnFavoriteTrophies]', gameId, err)
        if (current) setError(err instanceof Error ? err.message : 'Unknown error')
      })
    return () => {
      current = false
    }
  }, [gameId, status, url])

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

  return { pinned, leading, toggle, error, canPin: status === 'authenticated' && !subject }
}
