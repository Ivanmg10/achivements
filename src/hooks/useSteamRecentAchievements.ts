import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { toSteamLanguage } from '@/utils/steamLanguage'
import type { SteamRecentAchievement } from '@/types/steam'

/**
 * The player's Steam unlocks, in the app language: the latest few across recent
 * games (`recent`, for the profile column), or every unlock of the last 60 days
 * (`activity`, for the main page's activity charts). `null` loads nothing.
 */
export function useSteamRecentAchievements(scope: 'recent' | 'activity' | null = 'recent') {
  const endpoint = scope === 'activity' ? 'activity' : scope === 'recent' ? 'recentAchievements' : null
  const { data: session } = useSession()
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
      const res = await fetch(`/api/steam/${endpoint}?lang=${language}`, { cache: 'no-store' })
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
  }, [endpoint])

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
