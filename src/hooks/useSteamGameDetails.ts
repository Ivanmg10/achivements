import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { toSteamLanguage } from '@/utils/steamLanguage'
import type { SteamGameDetails } from '@/types/steam'

/**
 * Store details for one Steam game page, in the app's language. A 404 means
 * the game has no store entry (delisted) — that is not an error, the page just
 * has no details to show.
 */
export function useSteamGameDetails(appId: number | null) {
  const { lang } = useLanguage()
  const steamLang = toSteamLanguage(lang)

  const [details, setDetails] = useState<SteamGameDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (id: number, language: string, isCurrent: () => boolean = () => true) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/steam/gameDetails?appid=${id}&lang=${language}`)
      if (res.status === 404) {
        if (isCurrent()) setDetails(null)
        return
      }
      if (!res.ok) throw new Error(`Failed to load game details (${res.status})`)
      const data = (await res.json()) as SteamGameDetails
      if (isCurrent()) setDetails(data)
    } catch (err) {
      console.error('[useSteamGameDetails]', id, err)
      if (isCurrent()) setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (isCurrent()) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setDetails(null)
    if (appId === null) return
    // Moving to another game (or language) before this one answers must not
    // leave the previous game's details on screen.
    let current = true
    load(appId, steamLang, () => current)
    return () => {
      current = false
    }
  }, [appId, steamLang, load])

  const retry = useCallback(() => {
    if (appId !== null) load(appId, steamLang)
  }, [appId, steamLang, load])

  return { details, isLoading, error, retry }
}
