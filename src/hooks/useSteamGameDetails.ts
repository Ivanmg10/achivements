import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { toSteamLanguage } from '@/utils/steamLanguage'
import type { SteamGameDetails } from '@/types/steam'
import { useWhenChanged } from '@/hooks/useWhenChanged'

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

  /** Asks the server; what came back, not yet applied. A 404 is no details, not an error. */
  const request = useCallback(async (id: number, language: string): Promise<{ details: SteamGameDetails | null } | { error: string }> => {
    try {
      const res = await fetch(`/api/steam/gameDetails?appid=${id}&lang=${language}`)
      if (res.status === 404) return { details: null }
      if (!res.ok) throw new Error(`Failed to load game details (${res.status})`)
      return { details: (await res.json()) as SteamGameDetails }
    } catch (err) {
      console.error('[useSteamGameDetails]', id, err)
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }, [])

  const settle = useCallback((outcome: { details: SteamGameDetails | null } | { error: string }) => {
    if ('error' in outcome) setError(outcome.error)
    else setDetails(outcome.details)
    setIsLoading(false)
  }, [])

  // Another game or language starts over; state, so while rendering. The load is the effect.
  useWhenChanged([appId, steamLang], () => {
    setDetails(null)
    setError(null)
    setIsLoading(appId !== null)
  })

  useEffect(() => {
    if (appId === null) return
    // Moving to another game (or language) before this one answers must not
    // leave the previous game's details on screen.
    let current = true
    request(appId, steamLang).then((outcome) => {
      if (current) settle(outcome)
    })
    return () => {
      current = false
    }
  }, [appId, steamLang, request, settle])

  const retry = useCallback(() => {
    if (appId === null) return
    setIsLoading(true)
    setError(null)
    request(appId, steamLang).then(settle)
  }, [appId, steamLang, request, settle])

  return { details, isLoading, error, retry }
}
