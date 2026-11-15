'use client'

import { useSession } from 'next-auth/react'
import { xboxErrorFrom, type XboxLinkError } from '@/hooks/useXboxLink'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import type { XboxGameProgress } from '@/types/xbox'
import { createConsoleLibrary, type ConsoleLibraryData } from '@/context/consoleLibrary'

const { Provider, useData } = createConsoleLibrary<XboxGameProgress, XboxLinkError>({
  source: 'xbox',
  url: '/api/xbox/titles',
  errorFrom: xboxErrorFrom,
})

/**
 * The Xbox library, shared app-wide like PsnGamesDataContext (`createConsoleLibrary`). OpenXBL returns
 * the whole library with its progress in one call, so there is no fill-in pass. No retry loop either:
 * every call spends the app's hourly OpenXBL budget. It loads on its first reader, and nothing is
 * asked unless the person may use Xbox at all (an admin, for now).
 */
export function XboxGamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const enabled = useXboxEnabled()
  return <Provider id={enabled ? (session?.user?.xboxxuid ?? null) : null}>{children}</Provider>
}

export type XboxGamesCtx = ConsoleLibraryData<XboxGameProgress, XboxLinkError>
export const useXboxGamesData = useData
