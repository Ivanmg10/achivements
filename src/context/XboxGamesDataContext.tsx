'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { xboxErrorFrom, type XboxLinkError } from '@/hooks/useXboxLink'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { useHiddenConsoles } from '@/hooks/useHiddenConsoles'
import { consoleOptions, filterByConsole, type ConsoleOption } from '@/utils/consoleFilter'
import type { XboxGameProgress } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useHiddenGames } from '@/context/HiddenGamesContext'

type XboxGamesCtx = {
  isLinked: boolean
  /** The library without the consoles unticked in preferences, most recently played first. */
  library: XboxGameProgress[]
  /** Every game, ticked consoles or not: for what looks a game up by id (its page, a pin, a group). */
  fullLibrary: XboxGameProgress[]
  /** The consoles in the library, for the preferences to tick. */
  consoles: ConsoleOption[]
  libraryLoading: boolean
  libraryError: XboxLinkError | null
  refetch: () => void
}

const Ctx = createContext<XboxGamesCtx>({
  isLinked: false,
  library: [],
  fullLibrary: [],
  consoles: [],
  libraryLoading: false,
  libraryError: null,
  refetch: () => {},
})

/**
 * The Xbox library, shared app-wide like PsnGamesDataContext: one load feeds
 * the main page, the category pages and the game pages. OpenXBL returns the
 * whole library with its progress in one call, so there is no fill-in pass. No
 * retry loop either — every call spends the app's hourly OpenXBL budget.
 *
 * Nothing is asked unless the person may use Xbox at all (an admin, for now).
 */
export function XboxGamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const enabled = useXboxEnabled()
  const subject = useSubject()
  const { hidden } = useHiddenConsoles('xbox')
  const { isHidden, isLoading: hiddenLoading } = useHiddenGames()
  const xuid = enabled ? (session?.user?.xboxxuid ?? null) : null

  const [library, setLibrary] = useState<XboxGameProgress[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<XboxLinkError | null>(null)
  /** The account the list (or error) belongs to — the first paint for a new one is "loading". */
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const requested = useRef<string | null>(null)
  const generation = useRef(0)

  const load = useCallback(async (forId: string) => {
    const gen = ++generation.current
    setLibraryLoading(true)
    setLibraryError(null)
    try {
      const res = await fetch(withSubject('/api/xbox/titles', subject), { cache: 'no-store' })
      if (gen !== generation.current) return
      if (!res.ok) {
        setLibraryError(await xboxErrorFrom(res))
        return
      }
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Unexpected Xbox response')
      setLibrary(data as XboxGameProgress[])
    } catch (err) {
      if (gen !== generation.current) return
      console.error('[XboxGamesData]', err)
      setLibraryError('failed')
    } finally {
      if (gen === generation.current) {
        setLibraryLoading(false)
        setLoadedFor(forId)
      }
    }
  }, [subject])

  useEffect(() => {
    if (!xuid) {
      requested.current = null
      generation.current++
      return
    }
    if (requested.current === xuid) return
    requested.current = xuid
    load(xuid)
  }, [xuid, load])

  const refetch = useCallback(() => {
    if (xuid) load(xuid)
  }, [xuid, load])

  const current = Boolean(xuid) && loadedFor === xuid
  const fullLibrary = useMemo(() => (current ? library : []), [current, library])
  // The preference is the viewer's own: someone else's library is shown whole.
  const shown = useMemo(
    () => hiddenLoading ? [] : (subject ? fullLibrary : filterByConsole(fullLibrary, (g) => g.consoleName, hidden)).filter((g) => !isHidden(g.id, 'xbox')),
    [subject, fullLibrary, hidden, isHidden, hiddenLoading],
  )
  const consoles = useMemo(() => consoleOptions(fullLibrary.map((g) => g.consoleName)), [fullLibrary])

  return (
    <Ctx.Provider
      value={{
        isLinked: Boolean(xuid),
        library: shown,
        fullLibrary,
        consoles,
        libraryLoading: Boolean(xuid && (hiddenLoading || libraryLoading || !current)),
        libraryError: current ? libraryError : null,
        refetch,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useXboxGamesData = () => useContext(Ctx)
