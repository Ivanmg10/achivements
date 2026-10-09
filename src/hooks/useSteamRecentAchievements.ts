import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { toSteamLanguage } from '@/utils/steamLanguage'
import type { SteamRecentAchievement } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

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

  const load = useCallback(async (language: string, isCurrent: () => boolean = () => true) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(withSubject(`/api/steam/${endpoint}?lang=${language}`, subject), { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load recent achievements (${res.status})`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Unexpected recent achievements response')
      if (isCurrent()) setAchievements(data as SteamRecentAchievement[])
    } catch (err) {
      console.error('[useSteamRecentAchievements]', err)
      if (isCurrent()) setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (isCurrent()) setIsLoading(false)
    }
  }, [endpoint, subject])

  useEffect(() => {
    setAchievements([])
    if (!steamid || !endpoint) {
      setError(null)
      setIsLoading(false)
      return
    }
    // A slower answer for a previous account or language must not land on top.
    let current = true
    load(steamLang, () => current)
    return () => {
      current = false
    }
  }, [steamid, steamLang, endpoint, load])

  const retry = useCallback(() => {
    if (steamid && endpoint) load(steamLang)
  }, [steamid, steamLang, endpoint, load])

  return { achievements, isLoading, error, retry }
}
