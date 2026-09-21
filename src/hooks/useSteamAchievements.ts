import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { toSteamLanguage } from '@/utils/steamLanguage'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * Achievements for one Steam game, loaded on demand (when a card is expanded
 * or a game page opens) rather than for every game in a list, in the app's
 * language — Steam localises achievement names.
 *
 * Results are kept per game and language, so collapsing and re-expanding a
 * card does not refetch, and switching language does.
 */
export function useSteamAchievements(appId: number | null) {
  const { lang } = useLanguage()
  const steamLang = toSteamLanguage(lang)
  const key = appId === null ? null : `${appId}|${steamLang}`

  const [byKey, setByKey] = useState<Map<string, SteamAchievementUnified[]>>(new Map())
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const inFlight = useRef<Set<string>>(new Set())

  const load = useCallback(async (id: number, language: string) => {
    const k = `${id}|${language}`
    if (inFlight.current.has(k)) return
    inFlight.current.add(k)
    setLoadingKey(k)
    setErrors((prev) => {
      const next = new Map(prev)
      next.delete(k)
      return next
    })
    try {
      const res = await fetch(`/api/steam/achievements?appid=${id}&lang=${language}`)
      if (!res.ok) throw new Error(`Failed to load achievements (${res.status})`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Unexpected achievements response')
      setByKey((prev) => new Map(prev).set(k, data as SteamAchievementUnified[]))
    } catch (err) {
      console.error('[useSteamAchievements]', k, err)
      setErrors((prev) => new Map(prev).set(k, err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      inFlight.current.delete(k)
      setLoadingKey((current) => (current === k ? null : current))
    }
  }, [])

  useEffect(() => {
    if (appId === null || key === null || byKey.has(key) || errors.has(key)) return
    load(appId, steamLang)
  }, [appId, key, steamLang, byKey, errors, load])

  const retry = useCallback(() => {
    if (appId !== null) load(appId, steamLang)
  }, [appId, steamLang, load])

  return {
    achievements: key !== null ? byKey.get(key) ?? [] : [],
    isLoading: key !== null && loadingKey === key,
    error: key !== null ? errors.get(key) ?? null : null,
    retry,
  }
}
