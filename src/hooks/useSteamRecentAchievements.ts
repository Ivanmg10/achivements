import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { toSteamLanguage } from '@/utils/steamLanguage'
import type { SteamRecentAchievement } from '@/types/steam'

/** The player's latest Steam unlocks across recent games, in the app language. */
export function useSteamRecentAchievements() {
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
      const res = await fetch(`/api/steam/recentAchievements?lang=${language}`, { cache: 'no-store' })
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
  }, [])

  useEffect(() => {
    setAchievements([])
    if (!steamid) {
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
  }, [steamid, steamLang, load])

  const retry = useCallback(() => {
    if (steamid) load(steamLang)
  }, [steamid, steamLang, load])

  return { achievements, isLoading, error, retry }
}
