'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnGameProgress } from '@/types/psn'
import { usePsnPlatinumCompletes } from '@/hooks/usePsnPlatinumCompletes'
import { useHiddenConsoles } from '@/hooks/useHiddenConsoles'
import { consoleOptions, filterByConsole, type ConsoleOption } from '@/utils/consoleFilter'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

type PsnGamesCtx = {
  isLinked: boolean
  /** The trophy list without the consoles unticked in preferences, most recently played first. */
  library: PsnGameProgress[]
  /** Every game, ticked consoles or not: for what looks a game up by id (its page, a pin, a group). */
  fullLibrary: PsnGameProgress[]
  /** The consoles in the list, for the preferences to tick. */
  consoles: ConsoleOption[]
  libraryLoading: boolean
  libraryError: PsnError | null
  refetch: () => void
}

const Ctx = createContext<PsnGamesCtx>({
  isLinked: false,
  library: [],
  fullLibrary: [],
  consoles: [],
  libraryLoading: false,
  libraryError: null,
  refetch: () => {},
})

/**
 * The PSN trophy list, shared app-wide like SteamGamesDataContext: one load
 * feeds the main page, the category pages and the game pages. Sony returns
 * the whole list with its counts in one go, so there is no fill-in pass.
 * No retry loop either — every call spends the app's one PSN account.
 */
export function PsnGamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const subject = useSubject()
  const [platinumCompletes] = usePsnPlatinumCompletes()
  const { hidden } = useHiddenConsoles('psn')
  const accountId = session?.user?.psnaccountid ?? null

  const [library, setLibrary] = useState<PsnGameProgress[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<PsnError | null>(null)
  /** The account the list (or error) belongs to — the first paint for a new one is "loading". */
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const requested = useRef<string | null>(null)
  const generation = useRef(0)

  const load = useCallback(async (forId: string) => {
    const gen = ++generation.current
    setLibraryLoading(true)
    setLibraryError(null)
    try {
      const res = await fetch(withSubject('/api/psn/titles', subject), { cache: 'no-store' })
      if (gen !== generation.current) return
      if (!res.ok) {
        setLibraryError(await psnErrorFrom(res))
        return
      }
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('Unexpected PSN response')
      setLibrary(data as PsnGameProgress[])
    } catch (err) {
      if (gen !== generation.current) return
      console.error('[PsnGamesData]', err)
      setLibraryError('failed')
    } finally {
      if (gen === generation.current) {
        setLibraryLoading(false)
        setLoadedFor(forId)
      }
    }
  }, [subject])

  useEffect(() => {
    if (!accountId) {
      requested.current = null
      generation.current++
      return
    }
    if (requested.current === accountId) return
    requested.current = accountId
    load(accountId)
  }, [accountId, load])

  const refetch = useCallback(() => {
    if (accountId) load(accountId)
  }, [accountId, load])

  const current = Boolean(accountId) && loadedFor === accountId
  const games = useMemo(
    () => (platinumCompletes ? library.map((g) => (g.earned.platinum > 0 ? { ...g, platinumCompletes: true } : g)) : library),
    [library, platinumCompletes],
  )
  const fullLibrary = useMemo(() => (current ? games : []), [current, games])
  // The preference is the viewer's own: someone else's list is shown whole.
  const shown = useMemo(() => (subject ? fullLibrary : filterByConsole(fullLibrary, (g) => g.consoleName, hidden)), [subject, fullLibrary, hidden])
  const consoles = useMemo(() => consoleOptions(fullLibrary.map((g) => g.consoleName)), [fullLibrary])

  return (
    <Ctx.Provider
      value={{
        isLinked: Boolean(accountId),
        library: shown,
        fullLibrary,
        consoles,
        libraryLoading: Boolean(accountId) && (libraryLoading || !current),
        libraryError: current ? libraryError : null,
        refetch,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const usePsnGamesData = () => useContext(Ctx)
