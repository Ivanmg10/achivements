import { useCallback, useEffect, useRef, useState } from 'react'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * Achievements for one Steam game, loaded on demand (when a card is expanded)
 * rather than for every game in a list. Results are kept per appid so
 * collapsing and re-expanding a card does not refetch.
 */
export function useSteamAchievements(appId: number | null) {
  const [byApp, setByApp] = useState<Map<number, SteamAchievementUnified[]>>(new Map())
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [errors, setErrors] = useState<Map<number, string>>(new Map())
  const inFlight = useRef<Set<number>>(new Set())

  const load = useCallback(async (id: number) => {
    if (inFlight.current.has(id)) return
    inFlight.current.add(id)
    setLoadingId(id)
    setErrors((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    try {
      const res = await fetch(`/api/steam/achievements?appid=${id}`)
      if (!res.ok) throw new Error(`Failed to load achievements (${res.status})`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Unexpected achievements response')
      setByApp((prev) => new Map(prev).set(id, data as SteamAchievementUnified[]))
    } catch (err) {
      console.error('[useSteamAchievements]', id, err)
      setErrors((prev) => new Map(prev).set(id, err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      inFlight.current.delete(id)
      setLoadingId((current) => (current === id ? null : current))
    }
  }, [])

  useEffect(() => {
    if (appId === null || byApp.has(appId) || errors.has(appId)) return
    load(appId)
  }, [appId, byApp, errors, load])

  const retry = useCallback(() => {
    if (appId !== null) load(appId)
  }, [appId, load])

  return {
    achievements: appId !== null ? byApp.get(appId) ?? [] : [],
    isLoading: appId !== null && loadingId === appId,
    error: appId !== null ? errors.get(appId) ?? null : null,
    retry,
  }
}
