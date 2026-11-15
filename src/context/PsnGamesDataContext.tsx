'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnGameProgress } from '@/types/psn'
import { usePsnPlatinumCompletes } from '@/hooks/usePsnPlatinumCompletes'
import { createConsoleLibrary, type ConsoleLibraryData } from '@/context/consoleLibrary'

/** Every PlayStation with trophies, as `psnPlatformName` writes them: always in the preference, games or not. */
const PSN_CONSOLES = ['PS3', 'PS Vita', 'PS4', 'PS5']

const { Provider, useData } = createConsoleLibrary<PsnGameProgress, PsnError>({
  source: 'psn',
  url: '/api/psn/titles',
  errorFrom: psnErrorFrom,
  always: PSN_CONSOLES,
})

const withPlatinum = (g: PsnGameProgress) => (g.earned.platinum > 0 ? { ...g, platinumCompletes: true } : g)

/**
 * The PSN trophy list, shared app-wide like SteamGamesDataContext (`createConsoleLibrary`). Sony returns
 * the whole list with its counts in one go, so there is no fill-in pass. No retry loop either: every
 * call spends the app's one PSN account.
 */
export function PsnGamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [platinumCompletes] = usePsnPlatinumCompletes()
  const map = useMemo(() => (platinumCompletes ? withPlatinum : undefined), [platinumCompletes])
  return (
    <Provider id={session?.user?.psnaccountid ?? null} map={map}>
      {children}
    </Provider>
  )
}

export type PsnGamesCtx = ConsoleLibraryData<PsnGameProgress, PsnError>
export const usePsnGamesData = useData
