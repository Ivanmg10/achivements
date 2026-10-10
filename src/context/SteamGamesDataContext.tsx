'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { countLoadedProgress, hasSteamAchievements, hasUnloadedProgress } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useWhenChanged } from '@/hooks/useWhenChanged'

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
  const subject = useSubject()
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

    try {
      const games = await fetchGames(withSubject('/api/steam/recentlyPlayed', subject))
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
      games = await fetchGames(withSubject('/api/steam/ownedGames', subject))
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
        next = await fetchGames(withSubject('/api/steam/ownedGames', subject))
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
  }, [subject])

  // A new account (or none) starts the lists over. State, so it happens while
  // rendering; the refs and the load stay in the effect below.
  useWhenChanged([steamid, subject], () => {
    setRecent([])
    setLibrary([])
    setRecentLoading(Boolean(steamid))
    setLibraryLoading(Boolean(steamid))
    setRecentError(null)
    setLibraryError(null)
  })

  useEffect(() => {
    if (!steamid) {
      // Unlinked (or signed out): end any load in progress.
      generation.current++
      loadedFor.current = null
      return
    }
    if (loadedFor.current === steamid) return
    loadedFor.current = steamid
    load(steamid)
    // The ref objects themselves: the cleanup must bump whatever load is live then.
    const gen = generation
    const loaded = loadedFor

    // On unmount (e.g. signing out) or a new account, end any load or
    // background fill in progress. Clearing loadedFor too means a remount —
    // including Strict Mode's dev-only unmount/remount — loads again instead
    // of finding the discarded load marked as done.
    return () => {
      gen.current++
      loaded.current = null
    }
  }, [steamid, load])

  const refetch = useCallback(() => {
    if (!steamid) return
    setRecentLoading(true)
    setRecentError(null)
    setLibraryLoading(true)
    setLibraryError(null)
    load(steamid)
  }, [steamid, load])

  // Games with no achievements at all are left out of every list (see hasSteamAchievements).
  const withAchievementsRecent = useMemo(() => recent.filter(hasSteamAchievements), [recent])
  const withAchievementsLibrary = useMemo(() => library.filter(hasSteamAchievements), [library])

  return (
    <Ctx.Provider
      value={{
        isLinked: Boolean(steamid),
        recent: withAchievementsRecent,
        recentLoading,
        recentError,
        library: withAchievementsLibrary,
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
