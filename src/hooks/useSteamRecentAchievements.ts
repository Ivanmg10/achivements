import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { toSteamLanguage } from '@/utils/steamLanguage'
import type { SteamRecentAchievement } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useWhenChanged } from '@/hooks/useWhenChanged'

const ENDPOINTS = {
  recent: 'recentAchievements',
  activity: 'activity',
  year: 'unlockYear',
} as const

export type SteamUnlockScope = keyof typeof ENDPOINTS

/**
 * The player's Steam unlocks, in the app language: the latest few across recent
 * games (`recent`, for the profile column), every unlock of the last 60 days
 * (`activity`, for the main page's activity charts), or of the last year
 * (`year`, for the streak). `null` loads nothing.
 */
export function useSteamRecentAchievements(scope: SteamUnlockScope | null = 'recent') {
  const endpoint = scope ? ENDPOINTS[scope] : null
  const { data: session } = useSession()
  const subject = useSubject()
  const steamid = session?.user?.steamid ?? null
  const { lang } = useLanguage()
  const steamLang = toSteamLanguage(lang)

  const [achievements, setAchievements] = useState<SteamRecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Asks the server; what came back, not yet applied. */
  const request = useCallback(async (language: string): Promise<{ achievements: SteamRecentAchievement[] } | { error: string }> => {
    try {
      const res = await fetch(withSubject(`/api/steam/${endpoint}?lang=${language}`, subject), { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load recent achievements (${res.status})`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Unexpected recent achievements response')
      return { achievements: data as SteamRecentAchievement[] }
    } catch (err) {
      console.error('[useSteamRecentAchievements]', err)
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [endpoint, subject])

  const settle = useCallback((outcome: { achievements: SteamRecentAchievement[] } | { error: string }) => {
    if ('error' in outcome) setError(outcome.error)
    else setAchievements(outcome.achievements)
    setIsLoading(false)
  }, [])

  // A new account, language or scope starts over; state, so while rendering. The load is the effect.
  useWhenChanged([steamid, steamLang, endpoint], () => {
    setAchievements([])
    setError(null)
    setIsLoading(Boolean(steamid && endpoint))
  })

  useEffect(() => {
    if (!steamid || !endpoint) return
    // A slower answer for a previous account or language must not land on top.
    let current = true
    request(steamLang).then((outcome) => {
      if (current) settle(outcome)
    })
    return () => {
      current = false
    }
  }, [steamid, steamLang, endpoint, request, settle])

  const retry = useCallback(() => {
    if (!steamid || !endpoint) return
    setIsLoading(true)
    setError(null)
    request(steamLang).then(settle)
  }, [steamid, steamLang, endpoint, request, settle])

  return { achievements, isLoading, error, retry }
}
