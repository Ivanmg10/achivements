'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnGameProgress } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

type PsnGamesCtx = {
  isLinked: boolean
  /** Every game in the trophy list, most recently played first. */
  library: PsnGameProgress[]
  libraryLoading: boolean
  libraryError: PsnError | null
  refetch: () => void
}

const Ctx = createContext<PsnGamesCtx>({
  isLinked: false,
  library: [],
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

  return (
    <Ctx.Provider
      value={{
        isLinked: Boolean(accountId),
        library: current ? library : [],
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
