'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { countLoadedProgress, hasUnloadedProgress } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'

/** Follow-up library requests while the server is still filling counts. */
const MAX_FILL_PASSES = 10
const FILL_DELAY_MS = 500

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

/**
 * Always straight from the server: these lists change as the server fills in
 * counts, so a browser-cached copy would freeze a partial list in place. The
 * server's DB cache already makes a repeat request cheap.
 */
async function fetchGames(url: string): Promise<SteamGameProgress[]> {
  const res = await fetch(url, { cache: 'no-store' })
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

    let games: SteamGameProgress[]
    try {
      games = await fetchGames('/api/steam/ownedGames')
      if (!current()) return
      setLibrary(games)
    } catch (err) {
      if (!current()) return
      console.error('[SteamGamesData] library', forId, err)
      setLibraryError(err instanceof Error ? err.message : 'Unknown error')
      return
    } finally {
      if (current()) setLibraryLoading(false)
    }

    // The server counts achievements a batch per request, so a first load can
    // come back part-filled. Keep asking in the background until it is done —
    // or a pass makes no progress (a private profile, a game Steam keeps
    // failing), which would otherwise loop forever.
    for (let pass = 0; pass < MAX_FILL_PASSES && hasUnloadedProgress(games); pass++) {
      await new Promise((r) => setTimeout(r, FILL_DELAY_MS))
      if (!current()) return
      let next: SteamGameProgress[]
      try {
        next = await fetchGames('/api/steam/ownedGames')
      } catch (err) {
        // Keep what is already shown; the list is just less complete.
        console.error('[SteamGamesData] library fill', forId, err)
        return
      }
      if (!current()) return
      const progressed = countLoadedProgress(next) > countLoadedProgress(games)
      setLibrary(next)
      games = next
      if (!progressed) return
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

    // On unmount (e.g. signing out) or a new account, end any load or
    // background fill in progress. Clearing loadedFor too means a remount —
    // including Strict Mode's dev-only unmount/remount — loads again instead
    // of finding the discarded load marked as done.
    return () => {
      generation.current++
      loadedFor.current = null
    }
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
