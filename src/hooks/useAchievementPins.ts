import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { useSubject } from '@/context/SubjectContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'
import type { PinControl } from '@/types/achievementTable'
import type { RetroAchievement } from '@/types/types'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import type { XboxAchievement } from '@/types/xbox'

/** What tells one platform's pins from another's: the one thing they share is the `pinned_achievements` table. */
export type PinSpec<T, K extends string | number> = {
  source: 'ra' | 'steam' | 'psn' | 'xbox'
  /** The row's field that holds the achievement's id (`psn_trophy_id`). */
  column: string
  /** That id's name in the unpin query and the pin body (`psnTrophyId`). */
  param: string
  idOf: (item: T) => K
}

export const RA_PINS: PinSpec<RetroAchievement, number> = { source: 'ra', column: 'achievement_id', param: 'achievementId', idOf: (a) => a.ID }
export const STEAM_PINS: PinSpec<SteamAchievementUnified, string> = { source: 'steam', column: 'steam_apiname', param: 'steamApiname', idOf: (a) => a.apiname }
export const PSN_PINS: PinSpec<PsnTrophy, number> = { source: 'psn', column: 'psn_trophy_id', param: 'psnTrophyId', idOf: (t) => t.id }
export const XBOX_PINS: PinSpec<XboxAchievement, string> = { source: 'xbox', column: 'xbox_achievement_id', param: 'xboxAchievementId', idOf: (a) => a.id }

/**
 * Which of a game's achievements the viewer has pinned ("achievements to get"), and a toggle, for
 * the four platforms: stored in pinned_achievements under the spec's source, so they show up in the
 * main page's pinned card. Toggling is optimistic and rolls back, saying so, if the request fails.
 * `pins` is what the table and the badge grid take. `extra` goes into the pin's body (RA's player count).
 */
export function useAchievementPins<T, K extends string | number>(
  spec: PinSpec<T, K>,
  gameId: number | string | null | undefined,
  gameTitle: string | undefined,
  extra?: { numDistinctPlayers?: number },
) {
  const { T: texts } = useLanguage()
  const { status, data: session } = useAuthSession()
  const user = session?.user?.id
  const url = `/api/favorites?source=${spec.source}&gameId=${gameId}`
  // Pins are the viewer's own; on someone else's page they are not offered.
  const subject = useSubject()
  const [pinned, setPinned] = useState<Set<K>>(new Set())
  /**
   * The pins as they were when the page loaded: what a list orders by. Pinning
   * then leaves the row where it is — moved to the top, it took the focused star
   * with it, and the browser scrolled up after it.
   */
  const [leading, setLeading] = useState<Set<K>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const loadedUrl = useRef<string | null>(null)

  // Another game (or signing in) starts over, from its pins as they last showed (lastAnswers), while
  // they are read again; state, so while rendering. The load is the effect.
  useWhenChanged([url, status], () => {
    if (status === 'authenticated') {
      const shown = new Set(lastAnswer<K[]>(user, url) ?? [])
      setPinned(shown)
      setLeading(shown)
      setError(null)
    }
  })

  useEffect(() => {
    if (status !== 'authenticated' || !gameId) return
    let current = true
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load pinned achievements (${res.status})`)
        return res.json()
      })
      .then((rows: Record<string, K>[]) => {
        if (current && Array.isArray(rows)) {
          const ids = new Set(rows.map((r) => r[spec.column]))
          loadedUrl.current = url
          keepAnswer(user, url, [...ids])
          setPinned(ids)
          setLeading(ids)
        }
      })
      .catch((err) => {
        console.error('[useAchievementPins]', spec.source, gameId, err)
        if (current) setError(err instanceof Error ? err.message : 'Unknown error')
      })
    return () => {
      current = false
    }
  }, [spec, gameId, status, url, user])

  // What is shown is what the next visit starts from, a pin just added included.
  useEffect(() => {
    if (loadedUrl.current === url) keepAnswer(user, url, [...pinned])
  }, [pinned, user, url])

  const numDistinctPlayers = extra?.numDistinctPlayers
  const toggle = useCallback(
    async (item: T) => {
      const id = spec.idOf(item)
      const wasPinned = pinned.has(id)
      const flip = (set: Set<K>) => {
        const next = new Set(set)
        if (!next.delete(id)) next.add(id)
        return next
      }
      setPinned(flip)
      setError(null)
      try {
        const res = wasPinned
          ? await fetch(`/api/favorites?${spec.param}=${encodeURIComponent(id)}&gameId=${gameId}`, { method: 'DELETE' })
          : await fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source: spec.source, [spec.param]: id, achievement: item, gameId, gameTitle, numDistinctPlayers }),
            })
        if (!res.ok) throw new Error(`Failed to update pin (${res.status})`)
        notify.success(texts.toast.achievementsUpdated)
      } catch (err) {
        console.error('[useAchievementPins] toggle', spec.source, id, err)
        setPinned(flip)
        setError(err instanceof Error ? err.message : 'Unknown error')
        notify.error(texts.toast.achievementsFailed)
      }
    },
    [spec, pinned, gameId, gameTitle, numDistinctPlayers, texts],
  )

  const canPin = status === 'authenticated' && !subject
  const pins: PinControl<T> = useMemo(
    () => ({ canPin, isPinned: (t) => pinned.has(spec.idOf(t)), leads: (t) => leading.has(spec.idOf(t)), toggle }),
    [canPin, pinned, leading, toggle, spec],
  )
  return { pins, error }
}
