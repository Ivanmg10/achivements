'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useHiddenConsoles } from '@/hooks/useHiddenConsoles'
import { consoleOptions, filterByConsole, type ConsoleOption } from '@/utils/consoleFilter'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useHiddenGames } from '@/context/HiddenGamesContext'

export type ConsoleLibraryData<G, E> = {
  isLinked: boolean
  /** The list without the consoles unticked in preferences and the hidden games, most recently played first. */
  library: G[]
  /** Every game, ticked consoles or not: for what looks a game up by id (its page, a pin, a group). */
  fullLibrary: G[]
  /** The consoles in the list, for the preferences to tick. */
  consoles: ConsoleOption[]
  libraryLoading: boolean
  libraryError: E | null
  refetch: () => void
}

type Config<E> = {
  source: 'psn' | 'xbox'
  url: string
  errorFrom: (res: Response) => Promise<E>
  /** Consoles the preference always lists, games or not. */
  always?: readonly string[]
}

/**
 * The library of a platform that answers in one call (PSN's trophy list, Xbox's library), shared
 * app-wide: one load feeds the main page, the category pages and the game pages. No fill-in pass and
 * no retry loop, since every call spends the app's one account (PSN) or hourly budget (Xbox).
 *
 * It loads on its first reader (`useData` asks, #101), never at mount. `Provider` takes the account
 * the list belongs to (null: nothing to read, as for an Xbox that is not enabled) and, optionally,
 * `map` over each game (stable: PSN's platinum-completes preference).
 */
export function createConsoleLibrary<G extends { id: number; consoleName: string }, E>({ source, url, errorFrom, always }: Config<E>) {
  const EMPTY: ConsoleLibraryData<G, E> & { request: () => void } = {
    isLinked: false,
    library: [],
    fullLibrary: [],
    consoles: [],
    libraryLoading: false,
    libraryError: null,
    refetch: () => {},
    request: () => {},
  }
  const Ctx = createContext(EMPTY)

  function Provider({ id, map, children }: { id: string | null; map?: (game: G) => G; children: React.ReactNode }) {
    const subject = useSubject()
    const { hidden } = useHiddenConsoles(source)
    const { isHidden, isLoading: hiddenLoading } = useHiddenGames()

    const [library, setLibrary] = useState<G[]>([])
    const [libraryLoading, setLibraryLoading] = useState(false)
    const [libraryError, setLibraryError] = useState<E | null>(null)
    /** The account the list (or error) belongs to — the first paint for a new one is "loading". */
    const [loadedFor, setLoadedFor] = useState<string | null>(null)
    const [wanted, setWanted] = useState(false)
    const request = useCallback(() => setWanted(true), [])
    const requested = useRef<string | null>(null)
    const generation = useRef(0)

    const load = useCallback(
      async (forId: string) => {
        const gen = ++generation.current
        setLibraryLoading(true)
        setLibraryError(null)
        try {
          const res = await fetch(withSubject(url, subject), { cache: 'no-store' })
          if (gen !== generation.current) return
          if (!res.ok) {
            setLibraryError(await errorFrom(res))
            return
          }
          const data = await res.json()
          if (!Array.isArray(data)) throw new Error(`Unexpected ${source} response`)
          setLibrary(data as G[])
        } catch (err) {
          if (gen !== generation.current) return
          console.error(`[${source}GamesData]`, err)
          setLibraryError('failed' as E)
        } finally {
          if (gen === generation.current) {
            setLibraryLoading(false)
            setLoadedFor(forId)
          }
        }
      },
      [subject],
    )

    useEffect(() => {
      if (!id) {
        requested.current = null
        generation.current++
        return
      }
      if (!wanted || requested.current === id) return
      requested.current = id
      load(id)
    }, [id, load, wanted])

    const refetch = useCallback(() => {
      if (id) load(id)
    }, [id, load])

    const current = Boolean(id) && loadedFor === id
    const games = useMemo(() => (map ? library.map(map) : library), [library, map])
    const fullLibrary = useMemo(() => (current ? games : []), [current, games])
    // The preference is the viewer's own: someone else's list is shown whole.
    const shown = useMemo(
      () => (hiddenLoading ? [] : (subject ? fullLibrary : filterByConsole(fullLibrary, (g) => g.consoleName, hidden)).filter((g) => !isHidden(g.id, source))),
      [subject, fullLibrary, hidden, isHidden, hiddenLoading],
    )
    const consoles = useMemo(
      () => (fullLibrary.length ? consoleOptions(fullLibrary.map((g) => g.consoleName), always) : []),
      [fullLibrary],
    )
    const isLoading = Boolean(id && (hiddenLoading || libraryLoading || !current))
    const error = current ? libraryError : null

    const value = useMemo(
      () => ({ isLinked: Boolean(id), library: shown, fullLibrary, consoles, libraryLoading: isLoading, libraryError: error, refetch, request }),
      [id, shown, fullLibrary, consoles, isLoading, error, refetch, request],
    )
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
  }

  /**
   * Reading the lists is what asks for them: the first reader starts the load (#101).
   * `passive` reads without asking, for what only needs `isLinked` (from the session).
   */
  function useData({ passive = false }: { passive?: boolean } = {}): ConsoleLibraryData<G, E> {
    const { request, ...value } = useContext(Ctx)
    useEffect(() => {
      if (!passive) request()
    }, [passive, request])
    return value
  }

  return { Provider, useData }
}
