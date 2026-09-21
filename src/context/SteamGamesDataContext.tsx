'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { SteamGameProgress } from '@/types/steam'

type SteamGamesCtx = {
  isLinked: boolean
  /** Recently played — the priority load, feeds the main page. */
  recent: SteamGameProgress[]
  recentLoading: boolean
  recentError: string | null
  /** Full library — deferred until the recent feed is in. Feeds category pages. */
  library: SteamGameProgress[]
  libraryLoading: boolean
  libraryError: string | null
  refetch: () => void
}

const EMPTY: SteamGamesCtx = {
  isLinked: false,
  recent: [],
  recentLoading: false,
  recentError: null,
  library: [],
  libraryLoading: false,
  libraryError: null,
  refetch: () => {},
}

const Ctx = createContext<SteamGamesCtx>(EMPTY)

async function fetchGames(url: string): Promise<SteamGameProgress[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Steam request failed (${res.status})`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected Steam response')
  return data as SteamGameProgress[]
}

/**
 * Steam game lists shared app-wide, mirroring RecentlyPlayedGamesContext.
 *
 * Loads in two steps per the plan's load strategy: the recent feed first
 * (what the main page shows), then the library. The library is the heavier
 * call server-side, so it waits instead of competing with the recent feed.
 *
 * Unlike the RA contexts there is no retry loop: the server already retries
 * Steam, and every retry here would spend rate-limit budget shared by the
 * whole app. A failure is surfaced and the user can retry.
 */
export function SteamGamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const steamid = session?.user?.steamid ?? null

  const [recent, setRecent] = useState<SteamGameProgress[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [recentError, setRecentError] = useState<string | null>(null)
  const [library, setLibrary] = useState<SteamGameProgress[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  /** Which account the lists belong to — a stale response for a previous link is dropped. */
  const loadedFor = useRef<string | null>(null)
  const generation = useRef(0)

  const load = useCallback(async (forId: string) => {
    const gen = ++generation.current
    const current = () => gen === generation.current

    setRecentLoading(true)
    setRecentError(null)
    setLibraryLoading(true)
    setLibraryError(null)

    try {
      const games = await fetchGames('/api/steam/recentlyPlayed')
      if (!current()) return
      setRecent(games)
    } catch (err) {
      if (!current()) return
      console.error('[SteamGamesData] recent', forId, err)
      setRecentError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (current()) setRecentLoading(false)
    }

    try {
      const games = await fetchGames('/api/steam/ownedGames')
      if (!current()) return
      setLibrary(games)
    } catch (err) {
      if (!current()) return
      console.error('[SteamGamesData] library', forId, err)
      setLibraryError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      if (current()) setLibraryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!steamid) {
      // Unlinked (or signed out): drop anything from a previous account.
      generation.current++
      loadedFor.current = null
      setRecent([])
      setLibrary([])
      setRecentLoading(false)
      setLibraryLoading(false)
      setRecentError(null)
      setLibraryError(null)
      return
    }
    if (loadedFor.current === steamid) return
    loadedFor.current = steamid
    setRecent([])
    setLibrary([])
    load(steamid)
  }, [steamid, load])

  const refetch = useCallback(() => {
    if (steamid) load(steamid)
  }, [steamid, load])

  return (
    <Ctx.Provider
      value={{
        isLinked: Boolean(steamid),
        recent,
        recentLoading,
        recentError,
        library,
        libraryLoading,
        libraryError,
        refetch,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useSteamGamesData = () => useContext(Ctx)
